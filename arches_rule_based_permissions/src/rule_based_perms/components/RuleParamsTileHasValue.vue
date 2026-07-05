<script setup lang="ts">
import { computed, inject } from "vue";
import { useGettext } from "vue3-gettext";

import MultiSelect from "primevue/multiselect";
import Select from "primevue/select";
import InputText from "primevue/inputtext";

import { isEditingKey } from "@/rule_based_perms/constants.ts";
import type { RuleConfig, NodeOption, TileHasValueParams } from "@/rule_based_perms/types.ts";

const props = defineProps<{
    formData: RuleConfig;
    nodeOptions: NodeOption[];
}>();

const { setIsEditing } = inject(isEditingKey)!;
const { $gettext } = useGettext();

const OP_OPTIONS = [
    { label: $gettext("equals"), value: "eq" },
    { label: $gettext("not equals"), value: "neq" },
    { label: $gettext("contains"), value: "contains" },
    { label: $gettext("not contains"), value: "not_contains" },
];

const ACTION_OPTIONS = [
    { label: $gettext("Read"), value: "view_resourceinstance" },
    { label: $gettext("Update"), value: "change_resourceinstance" },
    { label: $gettext("Delete"), value: "delete_resourceinstance" },
];

const selectedNode = computed<NodeOption | null>(
    () => props.nodeOptions.find((n) => n.id === props.formData.node_id) ?? null,
);

const params = computed(() => props.formData.value as TileHasValueParams);

function onNodeSelect(node: NodeOption | null) {
    props.formData.node_id = node?.id ?? null;
    props.formData.nodegroup_id = node?.nodegroup_id ?? null;
    setIsEditing(true);
}
</script>

<template>
    <!-- Node selection -->
    <section class="form-section" aria-labelledby="thv-node-heading">
        <h3 id="thv-node-heading">{{ $gettext("Node") }}</h3>
        <div class="form-field">
            <label for="thv-node">{{ $gettext("Node") }}</label>
            <Select
                input-id="thv-node"
                :model-value="selectedNode"
                :options="nodeOptions"
                :option-label="(n: NodeOption) => `${n.graph_name} › ${n.name}`"
                :filter="true"
                :filter-fields="['name', 'graph_name']"
                :placeholder="$gettext('Select a node...')"
                style="width: 100%"
                @update:model-value="onNodeSelect"
            />
        </div>
    </section>

    <!-- Value filter -->
    <section class="form-section" aria-labelledby="thv-filter-heading">
        <h3 id="thv-filter-heading">{{ $gettext("Value Filter") }}</h3>
        <div class="form-row">
            <div class="form-field">
                <label for="thv-op">{{ $gettext("Operation") }}</label>
                <Select
                    input-id="thv-op"
                    v-model="params.op"
                    :options="OP_OPTIONS"
                    option-label="label"
                    option-value="value"
                    style="width: 100%"
                    @update:model-value="setIsEditing(true)"
                />
            </div>
            <div class="form-field">
                <label for="thv-value">{{ $gettext("Value") }}</label>
                <InputText
                    id="thv-value"
                    v-model="params.value"
                    :placeholder="$gettext('e.g. Approved')"
                    style="width: 100%"
                    @update:model-value="setIsEditing(true)"
                />
            </div>
        </div>
    </section>

    <!-- Permissions -->
    <section class="form-section" aria-labelledby="thv-perms-heading">
        <h3 id="thv-perms-heading">{{ $gettext("Permissions") }}</h3>
        <div class="form-field">
            <label for="thv-perms">{{ $gettext("Actions") }}</label>
            <MultiSelect
                input-id="thv-perms"
                v-model="formData.actions"
                :options="ACTION_OPTIONS"
                option-label="label"
                option-value="value"
                :placeholder="$gettext('Select permissions...')"
                display="chip"
                style="width: 100%"
                @update:model-value="setIsEditing(true)"
            />
        </div>
    </section>
</template>

<style scoped>
.form-section {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--p-surface-200);
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

.form-row {
    display: flex;
    gap: 1rem;
}

.form-row .form-field {
    flex: 1;
}

label {
    font-weight: 600;
    color: var(--p-text-muted-color);
}
</style>
