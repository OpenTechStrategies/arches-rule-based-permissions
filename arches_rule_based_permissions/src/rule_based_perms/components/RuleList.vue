<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useGettext } from "vue3-gettext";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";

import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import MultiSelect from "primevue/multiselect";
import ProgressSpinner from "primevue/progressspinner";
import Select from "primevue/select";

import {
    selectedRuleKey,
    rulesKey,
    ERROR,
    SUCCESS,
    DANGER,
    SECONDARY,
    DEFAULT_ERROR_TOAST_LIFE,
} from "@/rule_based_perms/constants.ts";
import {
    deleteRuleConfig,
    createRuleConfig,
    fetchNodeOptions,
} from "@/rule_based_perms/api.ts";

import type { Ref } from "vue";
import type { RuleConfig, RuleValue, NodeOption } from "@/rule_based_perms/types.ts";

const toast = useToast();
const confirm = useConfirm();
const { $gettext } = useGettext();
const route = useRoute();

const { selectedRule, setSelectedRule } = inject<{
    selectedRule: Ref<RuleConfig | null>;
    setSelectedRule: (rule: RuleConfig | null) => void;
}>(selectedRuleKey)!;

const { rules, rulesLoading, loadRules } = inject<{
    rules: Ref<RuleConfig[]>;
    rulesLoading: Ref<boolean>;
    loadRules: () => Promise<void>;
}>(rulesKey)!;

// Sync route param to selection on initial load.
watch(
    rules,
    (loaded) => {
        if (route.params.id && !selectedRule.value) {
            const found = loaded.find((r) => r.id === route.params.id);
            if (found) selectedRule.value = found;
        }
    },
    { once: true },
);

// ----- Create dialog -----
const showCreateDialog = ref(false);
const nodeOptions: Ref<NodeOption[]> = ref([]);
const nodeOptionsLoading = ref(false);

const newRuleName = ref("");
const newRuleType = ref("filter_tile_has_value");
const newRuleNode: Ref<NodeOption | null> = ref(null);
const newRuleValue = ref("");
const newRuleOp = ref("eq");
const newRuleActions = ref<string[]>(["view_resourceinstance"]);
const newRuleLifecycleStates = ref("");
const createLoading = ref(false);

const TYPE_OPTIONS = [
    { label: $gettext("Tile has value"), value: "filter_tile_has_value" },
    { label: $gettext("Tile does not have value"), value: "filter_tile_does_not_have_value" },
    { label: $gettext("Resource has lifecycle state"), value: "filter_resource_has_lifecycle_state" },
    { label: $gettext("Tile spatial"), value: "filter_tile_spatial" },
];

const TYPE_LABELS: Record<string, string> = {
    filter_tile_has_value: $gettext("Tile has value"),
    filter_tile_does_not_have_value: $gettext("Tile does not have value"),
    filter_resource_has_lifecycle_state: $gettext("Resource has lifecycle state"),
    filter_tile_spatial: $gettext("Tile spatial"),
};

const createDisabled = computed(() => {
    if (newRuleType.value === "filter_tile_has_value") {
        return !newRuleNode.value || !newRuleActions.value.length;
    }
    if (newRuleType.value === "filter_resource_has_lifecycle_state") {
        return !newRuleLifecycleStates.value.trim();
    }
    return false;
});

const ACTION_OPTIONS = [
    { label: $gettext("Read"), value: "view_resourceinstance" },
    { label: $gettext("Update"), value: "change_resourceinstance" },
    { label: $gettext("Delete"), value: "delete_resourceinstance" },
];

const OP_OPTIONS = [
    { label: $gettext("equals"), value: "eq" },
    { label: $gettext("not equals"), value: "neq" },
    { label: $gettext("contains"), value: "contains" },
    { label: $gettext("not contains"), value: "not_contains" },
];

async function openCreateDialog() {
    newRuleName.value = "";
    newRuleType.value = "filter_tile_has_value";
    newRuleNode.value = null;
    newRuleValue.value = "";
    newRuleOp.value = "eq";
    newRuleActions.value = ["view_resourceinstance"];
    newRuleLifecycleStates.value = "";
    showCreateDialog.value = true;
    if (!nodeOptions.value.length) {
        nodeOptionsLoading.value = true;
        try {
            nodeOptions.value = await fetchNodeOptions();
        } catch (error) {
            toast.add({
                severity: ERROR,
                life: DEFAULT_ERROR_TOAST_LIFE,
                summary: $gettext("Failed to load nodes"),
                detail: error instanceof Error ? error.message : undefined,
            });
        } finally {
            nodeOptionsLoading.value = false;
        }
    }
}

async function handleCreate() {
    createLoading.value = true;
    try {
        const baseName = newRuleName.value || $gettext("New Rule");
        let payload: Parameters<typeof createRuleConfig>[0];

        if (newRuleType.value === "filter_tile_has_value") {
            payload = {
                name: baseName,
                type: "filter_tile_has_value",
                active: true,
                node_id: newRuleNode.value!.id,
                nodegroup_id: newRuleNode.value!.nodegroup_id,
                value: { value: newRuleValue.value, op: newRuleOp.value },
                actions: newRuleActions.value,
            };
        } else if (newRuleType.value === "filter_resource_has_lifecycle_state") {
            const states = newRuleLifecycleStates.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            payload = {
                name: baseName,
                type: "filter_resource_has_lifecycle_state",
                active: true,
                node_id: null,
                nodegroup_id: null,
                value: { value: states } as unknown as RuleValue,
                actions: ["view_resourceinstance"],
            };
        } else if (newRuleType.value === "filter_tile_spatial") {
            payload = {
                name: baseName,
                type: "filter_tile_spatial",
                active: true,
                node_id: null,
                nodegroup_id: null,
                value: { geojson: null, op: "intersects", resource_instance_id: null } as unknown as RuleValue,
                actions: ["view_resourceinstance"],
            };
        } else {
            payload = {
                name: baseName,
                type: newRuleType.value,
                active: true,
                node_id: null,
                nodegroup_id: null,
                value: null,
                actions: ["view_resourceinstance"],
            };
        }

        const created = await createRuleConfig(payload);
        await loadRules();
        setSelectedRule(created);
        showCreateDialog.value = false;
        toast.add({
            severity: SUCCESS,
            life: 3000,
            summary: $gettext("Rule created"),
        });
    } catch (error) {
        toast.add({
            severity: ERROR,
            life: DEFAULT_ERROR_TOAST_LIFE,
            summary: $gettext("Failed to create rule"),
            detail: error instanceof Error ? error.message : undefined,
        });
    } finally {
        createLoading.value = false;
    }
}

// ----- Delete -----
function confirmDelete(rule: RuleConfig, event: Event) {
    event.stopPropagation();
    confirm.require({
        message: $gettext("Delete rule \"%{name}\"?", { name: rule.name }, true),
        header: $gettext("Delete Rule"),
        icon: "fa fa-exclamation-triangle",
        acceptProps: {
            label: $gettext("Delete"),
            severity: DANGER,
            style: { fontSize: "small" },
        },
        rejectProps: {
            label: $gettext("Cancel"),
            severity: SECONDARY,
            style: { fontSize: "small" },
        },
        accept: () => handleDelete(rule),
    });
}

async function handleDelete(rule: RuleConfig) {
    try {
        await deleteRuleConfig(rule.id);
        if (selectedRule.value?.id === rule.id) {
            setSelectedRule(null);
        }
        await loadRules();
        toast.add({
            severity: SUCCESS,
            life: 3000,
            summary: $gettext("Rule deleted"),
        });
    } catch (error) {
        toast.add({
            severity: ERROR,
            life: DEFAULT_ERROR_TOAST_LIFE,
            summary: $gettext("Failed to delete rule"),
            detail: error instanceof Error ? error.message : undefined,
        });
    }
}
</script>

<template>
    <div class="rule-list-container">
        <!-- Toolbar -->
        <div class="rule-list-toolbar">
            <span class="rule-list-title">{{ $gettext("Rules") }}</span>
            <Button
                icon="fa fa-plus"
                :aria-label="$gettext('Add rule')"
                severity="secondary"
                text
                @click="openCreateDialog"
            />
        </div>

        <!-- Rules list -->
        <div
            v-if="rulesLoading"
            class="loading-state"
            role="status"
            :aria-label="$gettext('Loading rules')"
        >
            <ProgressSpinner style="width: 2rem; height: 2rem" aria-hidden="true" />
        </div>
        <div
            v-else-if="!rules.length"
            class="empty-state"
        >
            {{ $gettext("No rules yet. Click + to create one.") }}
        </div>
        <div
            v-else
            class="rule-list-items"
        >
            <div
                v-for="rule in rules"
                :key="rule.id"
                class="rule-list-item"
                :class="{ selected: selectedRule?.id === rule.id }"
                role="button"
                :tabindex="0"
                @click="setSelectedRule(rule)"
                @keydown.enter="setSelectedRule(rule)"
                @keydown.space.prevent="setSelectedRule(rule)"
            >
                <span
                    class="active-indicator"
                    :class="{ active: rule.active }"
                    role="img"
                    :aria-label="rule.active ? $gettext('Active') : $gettext('Inactive')"
                />
                <span class="rule-info">
                    <span class="rule-name">{{ rule.name }}</span>
                    <span class="rule-type">{{ TYPE_LABELS[rule.type] ?? rule.type }}</span>
                </span>
                <Button
                    icon="fa fa-trash"
                    :aria-label="$gettext('Delete rule %{name}', { name: rule.name }, true)"
                    severity="danger"
                    text
                    size="large"
                    @click="confirmDelete(rule, $event)"
                />
            </div>
        </div>
    </div>

    <!-- Create Rule Dialog -->
    <Dialog
        v-model:visible="showCreateDialog"
        :header="$gettext('New Permission Rule')"
        :draggable="false"
        :modal="true"
        style="width: 36rem; border-radius: 0"
        :pt="{
            header: {
                style: {
                    background: 'var(--p-navigation-header-color)',
                    color: 'white',
                    borderRadius: '0rem',
                },
            },
            title: { style: { fontWeight: 800, fontSize: 'small' } },
        }"
    >
        <div class="create-form">

            <div class="form-field">
                <label for="new-rule-type">{{ $gettext("Type") }}</label>
                <Select
                    id="new-rule-type"
                    v-model="newRuleType"
                    :options="TYPE_OPTIONS"
                    option-label="label"
                    option-value="value"
                    style="width: 100%"
                />
            </div>

            <div class="form-field">
                <label for="new-rule-name">{{ $gettext("Name") }}</label>
                <InputText
                    id="new-rule-name"
                    v-model="newRuleName"
                    :placeholder="$gettext('e.g. Reviewers can see Approved')"
                    style="width: 100%"
                />
            </div>

            <!-- filter_tile_has_value fields -->
            <template v-if="newRuleType === 'filter_tile_has_value'">
                <div class="form-field">
                    <label for="new-rule-node">{{ $gettext("Node") }}</label>
                    <Select
                        id="new-rule-node"
                        v-model="newRuleNode"
                        :options="nodeOptions"
                        :loading="nodeOptionsLoading"
                        :option-label="(n: NodeOption) => `${n.graph_name} › ${n.name}`"
                        :filter="true"
                        :filter-fields="['name', 'graph_name']"
                        :placeholder="$gettext('Select a node...')"
                        style="width: 100%"
                    />
                    <small
                        v-if="newRuleNode"
                        class="hint"
                    >
                        {{ $gettext("Nodegroup: %{id}", { id: newRuleNode.nodegroup_id ?? "—" }, true) }}
                    </small>
                </div>

                <div class="form-field">
                    <label for="new-rule-actions">{{ $gettext("Permissions") }}</label>
                    <MultiSelect
                        id="new-rule-actions"
                        v-model="newRuleActions"
                        :options="ACTION_OPTIONS"
                        option-label="label"
                        option-value="value"
                        :placeholder="$gettext('Select permissions...')"
                        style="width: 100%"
                    />
                </div>

                <div class="form-row">
                    <div class="form-field">
                        <label for="new-rule-op">{{ $gettext("Operation") }}</label>
                        <Select
                            id="new-rule-op"
                            v-model="newRuleOp"
                            :options="OP_OPTIONS"
                            option-label="label"
                            option-value="value"
                            style="width: 100%"
                        />
                    </div>
                    <div class="form-field">
                        <label for="new-rule-value">{{ $gettext("Value") }}</label>
                        <InputText
                            id="new-rule-value"
                            v-model="newRuleValue"
                            :placeholder="$gettext('e.g. Approved')"
                            style="width: 100%"
                        />
                    </div>
                </div>
            </template>

            <!-- filter_resource_has_lifecycle_state fields -->
            <template v-else-if="newRuleType === 'filter_resource_has_lifecycle_state'">
                <div class="form-field">
                    <label for="new-rule-lifecycle-states">{{ $gettext("Lifecycle States") }}</label>
                    <InputText
                        id="new-rule-lifecycle-states"
                        v-model="newRuleLifecycleStates"
                        :placeholder="$gettext('e.g. Draft, Review, Approved')"
                        style="width: 100%"
                    />
                    <small class="hint">{{ $gettext("Comma-separated list of lifecycle state names") }}</small>
                </div>
            </template>

            <!-- filter_tile_does_not_have_value: no extra fields -->
        </div>

        <template #footer>
            <Button
                :label="$gettext('Cancel')"
                severity="secondary"
                style="font-size: small"
                @click="showCreateDialog = false"
            />
            <Button
                :label="$gettext('Create')"
                :loading="createLoading"
                :disabled="createDisabled"
                style="font-size: small"
                @click="handleCreate"
            />
        </template>
    </Dialog>
</template>

<style scoped>
.rule-list-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    font-size: small;
}

.rule-list-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid var(--p-surface-200);
    flex-shrink: 0;
}

.rule-list-title {
    font-weight: 600;
}

.loading-state,
.empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    color: var(--p-text-muted-color);
    flex: 1;
}

.rule-list-items {
    overflow-y: auto;
    flex: 1;
}

.rule-list-item {
    display: flex;
    align-items: baseline;
    padding: 0.75rem 1rem;
    cursor: pointer;
    gap: 0.5rem;
    border-bottom: 1px solid var(--p-surface-100);
    outline: none;
}

.rule-list-item:hover {
    background: var(--p-surface-100);
}

.rule-list-item.selected {
    background: var(--p-primary-100, #e0eaff);
}

.rule-list-item:focus-visible {
    box-shadow: inset 0 0 0 2px var(--p-primary-500);
}

.active-indicator {
    width: 0.65rem;
    height: 0.65rem;
    border-radius: 50%;
    background: var(--p-surface-400);
    flex-shrink: 0;
    margin: .5rem;
}

.active-indicator.active {
    background: var(--p-green-500);
}

.rule-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.rule-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    gap: 0.1rem;
    padding-bottom: 0.6rem;
}

.rule-type {
    font-size: 0.9em;
    color: var(--p-text-muted-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Create form */
.create-form {
    padding: 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.form-row {
    display: flex;
    gap: 1rem;
}

.form-row .form-field {
    flex: 1;
}

label {
    font-weight: 600;
    font-size: small;
    color: var(--p-text-muted-color);
}

.hint {
    color: var(--p-text-muted-color);
    font-family: monospace;
}
</style>
