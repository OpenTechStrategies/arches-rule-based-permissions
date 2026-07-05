<script setup lang="ts">
import { computed, inject, onMounted, ref } from "vue";
import { useGettext } from "vue3-gettext";

import MultiSelect from "primevue/multiselect";

import { isEditingKey } from "@/rule_based_perms/constants.ts";
import { fetchLifecycleStateOptions } from "@/rule_based_perms/api.ts";
import type { LifecycleStateOption } from "@/rule_based_perms/api.ts";
import type { RuleConfig, LifecycleStateParams } from "@/rule_based_perms/types.ts";

const props = defineProps<{
    formData: RuleConfig;
}>();

const { setIsEditing } = inject(isEditingKey)!;
const { $gettext } = useGettext();

const params = computed(() => props.formData.value as LifecycleStateParams);

const ACTION_OPTIONS = [
    { label: $gettext("Read"), value: "view_resourceinstance" },
    { label: $gettext("Update"), value: "change_resourceinstance" },
    { label: $gettext("Delete"), value: "delete_resourceinstance" },
];

const lifecycleStateOptions = ref<LifecycleStateOption[]>([]);
const lifecycleStatesLoading = ref(false);

onMounted(async () => {
    lifecycleStatesLoading.value = true;
    try {
        lifecycleStateOptions.value = await fetchLifecycleStateOptions();
    } finally {
        lifecycleStatesLoading.value = false;
    }
});

function stateLabel(state: LifecycleStateOption): string {
    return `${state.name}`;
}
</script>

<template>
    <section class="form-section" aria-labelledby="lcs-heading">
        <h3 id="lcs-heading">{{ $gettext("Lifecycle States") }}</h3>
        <div class="form-field">
            <label for="lcs-states">{{ $gettext("States") }}</label>
            <MultiSelect
                input-id="lcs-states"
                v-model="params.value"
                :options="lifecycleStateOptions"
                :option-label="stateLabel"
                option-value="id"
                :loading="lifecycleStatesLoading"
                :placeholder="$gettext('Select lifecycle states...')"
                display="chip"
                style="width: 100%"
                @update:model-value="setIsEditing(true)"
            />
        </div>
    </section>

    <!-- Permissions -->
    <section class="form-section" aria-labelledby="lcs-perms-heading">
        <h3 id="lcs-perms-heading">{{ $gettext("Permissions") }}</h3>
        <div class="form-field">
            <label for="lcs-perms">{{ $gettext("Actions") }}</label>
            <MultiSelect
                input-id="lcs-perms"
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
}

label {
    font-weight: 600;
    color: var(--p-text-muted-color);
}

.hint {
    color: var(--p-text-muted-color);
    font-family: monospace;
    font-size: normal;
}
</style>
