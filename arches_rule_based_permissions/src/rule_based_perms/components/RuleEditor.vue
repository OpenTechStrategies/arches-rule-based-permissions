<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
import { useGettext } from "vue3-gettext";
import { useToast } from "primevue/usetoast";

import Button from "primevue/button";
import InputText from "primevue/inputtext";
import MultiSelect from "primevue/multiselect";

import RuleParamsTileHasValue from "@/rule_based_perms/components/RuleParamsTileHasValue.vue";
import RuleParamsLifecycleState from "@/rule_based_perms/components/RuleParamsLifecycleState.vue";
import RuleParamsTileSpatial from "@/rule_based_perms/components/RuleParamsTileSpatial.vue";
import RuleParamsTileDoesNotHaveValue from "@/rule_based_perms/components/RuleParamsTileDoesNotHaveValue.vue";

import {
    selectedRuleKey,
    isEditingKey,
    rulesKey,
    ERROR,
    SUCCESS,
    DEFAULT_ERROR_TOAST_LIFE,
} from "@/rule_based_perms/constants.ts";
import {
    updateRuleConfig,
    fetchNodeOptions,
    fetchGroupOptions,
} from "@/rule_based_perms/api.ts";

import type { Ref } from "vue";
import type { RuleConfig, AuthGroup, TileHasValueParams, LifecycleStateParams, SpatialParams } from "@/rule_based_perms/types.ts";

const toast = useToast();
const { $gettext } = useGettext();

const { selectedRule } = inject<{
    selectedRule: Ref<RuleConfig>;
}>( selectedRuleKey)!;

const { isEditing, setIsEditing } = inject<{
    isEditing: Ref<boolean>;
    setIsEditing: (val: boolean) => void;
}>(isEditingKey)!;

const { loadRules } = inject<{
    loadRules: () => Promise<void>;
}>(rulesKey)!;

// Load nodes and groups (cached after first call)
const [nodeOptions, groupOptions] = await Promise.all([
    fetchNodeOptions(),
    fetchGroupOptions(),
]);

// ----- Local form state -----
function defaultValueForType(rule: RuleConfig): RuleConfig["value"] {
    if (rule.value) return { ...rule.value };
    switch (rule.type) {
        case "filter_tile_has_value":
            return { value: "", op: "eq" } as TileHasValueParams;
        case "filter_resource_has_lifecycle_state":
            return { value: [] } as LifecycleStateParams;
        case "filter_tile_spatial":
            return { geojson: null, op: "intersects" } as SpatialParams;
        default:
            return null;
    }
}

function cloneRule(rule: RuleConfig) {
    return { ...rule, value: defaultValueForType(rule) };
}

const formData = ref<RuleConfig>(cloneRule(selectedRule.value));
const selectedGroupIds = ref<number[]>(
    selectedRule.value.groups.map((g) => g.id),
);
const isSaving = ref(false);
const originalActive = ref(selectedRule.value.active);

// Reset form when a different rule is selected.
watch(selectedRule, (newRule) => {
    formData.value = cloneRule(newRule);
    selectedGroupIds.value = newRule.groups.map((g) => g.id);
    originalActive.value = newRule.active;
    setIsEditing(false);
});

/** Map rule type to the appropriate params component */
const PARAMS_COMPONENTS = {
    filter_tile_has_value: RuleParamsTileHasValue,
    filter_tile_does_not_have_value: RuleParamsTileDoesNotHaveValue,
    filter_resource_has_lifecycle_state: RuleParamsLifecycleState,
    filter_tile_spatial: RuleParamsTileSpatial,
} as const;

const paramsComponent = computed(
    () =>
        PARAMS_COMPONENTS[formData.value.type as keyof typeof PARAMS_COMPONENTS] ??
        RuleParamsTileDoesNotHaveValue,
);

// ----- Save / Cancel -----
async function handleSave() {
    if (
        formData.value.type === "filter_tile_has_value" &&
        (!formData.value.node_id || !formData.value.nodegroup_id)
    ) {
        toast.add({
            severity: ERROR,
            life: DEFAULT_ERROR_TOAST_LIFE,
            summary: $gettext("Please select a node before saving"),
        });
        return;
    }
    isSaving.value = true;
    try {
        const updated = await updateRuleConfig(selectedRule.value.id, {
            name: formData.value.name,
            active: selectedRule.value.active,
            node_id: formData.value.node_id,
            nodegroup_id: formData.value.nodegroup_id,
            value: formData.value.value,
            actions: formData.value.actions,
            group_ids: selectedGroupIds.value,
        });
        // Reflect save back into the shared selectedRule so the header updates.
        Object.assign(selectedRule.value, updated);
        formData.value = cloneRule(updated);
        selectedGroupIds.value = updated.groups.map((g: AuthGroup) => g.id);
        originalActive.value = updated.active;
        setIsEditing(false);
        await loadRules();
        toast.add({
            severity: SUCCESS,
            life: 3000,
            summary: $gettext("Rule saved"),
        });
    } catch (error) {
        toast.add({
            severity: ERROR,
            life: DEFAULT_ERROR_TOAST_LIFE,
            summary: $gettext("Failed to save rule"),
            detail: error instanceof Error ? error.message : undefined,
        });
    } finally {
        isSaving.value = false;
    }
}

function handleCancel() {
    formData.value = cloneRule(selectedRule.value);
    selectedRule.value.active = originalActive.value;
    selectedGroupIds.value = selectedRule.value.groups.map((g) => g.id);
    setIsEditing(false);
}
</script>

<template>
    <div class="rule-editor">
        <!-- Rule identity -->
        <section class="form-section">
            <div class="form-field">
                <label for="rule-name">{{ $gettext("Name") }}</label>
                <InputText
                    id="rule-name"
                    v-model="formData.name"
                    style="width: 100%"
                    @update:model-value="setIsEditing(true)"
                />
            </div>
        </section>

        <!-- Type-specific parameters -->
        <component
            :is="paramsComponent"
            :form-data="formData"
            :node-options="nodeOptions"
        />

        <!-- Group assignment -->
        <section class="form-section" aria-labelledby="editor-groups-heading">
            <h3 id="editor-groups-heading">{{ $gettext("Groups") }}</h3>
            <p class="section-hint">
                {{
                    $gettext(
                        "Members of the selected groups will be subject to this rule.",
                    )
                }}
            </p>
            <MultiSelect
                input-id="editor-groups"
                v-model="selectedGroupIds"
                :options="groupOptions"
                option-label="name"
                option-value="id"
                :placeholder="$gettext('Select groups...')"
                display="chip"
                style="width: 100%"
                aria-labelledby="editor-groups-heading"
                @update:model-value="setIsEditing(true)"
            />
        </section>

        <!-- Actions -->
        <div class="form-actions">
            <Button
                :label="$gettext('Save')"
                :loading="isSaving"
                :disabled="!isEditing"
                @click="handleSave"
            />
            <Button
                :label="$gettext('Cancel')"
                severity="secondary"
                @click="handleCancel"
            />
        </div>
    </div>
</template>

<style scoped>
.rule-editor {
    padding: 1.5rem 1rem;
    font-size: small;
}

.form-section {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--p-surface-200);
}

.form-section:last-of-type {
    border-bottom: none;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-bottom: 1rem;
}

.form-field:last-child {
    margin-bottom: 0;
}

label,
.form-label {
    font-weight: 600;
    color: var(--p-text-muted-color);
}

.readonly-value {
    font-family: monospace;
    font-size: 0.9em;
    padding: 0.3rem 0.5rem;
    background: var(--p-surface-100);
    border-radius: 0.25rem;
    color: var(--p-text-muted-color);
    word-break: break-all;
}

.section-hint {
    color: var(--p-text-muted-color);
    margin-bottom: 0.75rem;
    margin-top: 0;
}

.form-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--p-surface-200);
}
</style>
