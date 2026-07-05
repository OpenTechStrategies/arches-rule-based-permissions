<script setup lang="ts">
import { inject } from "vue";
import { useGettext } from "vue3-gettext";

import MultiSelect from "primevue/multiselect";

import { isEditingKey } from "@/rule_based_perms/constants.ts";
import type { RuleConfig } from "@/rule_based_perms/types.ts";

const props = defineProps<{
    formData: RuleConfig;
}>();

const { setIsEditing } = inject(isEditingKey)!;
const { $gettext } = useGettext();

const ACTION_OPTIONS = [
    { label: $gettext("Read"), value: "view_resourceinstance" },
    { label: $gettext("Update"), value: "change_resourceinstance" },
    { label: $gettext("Delete"), value: "delete_resourceinstance" },
];
</script>

<template>
    <section class="form-section">
        <p class="hint">
            {{ $gettext("This rule type has no additional parameters.") }}
        </p>
    </section>

    <!-- Permissions -->
    <section class="form-section" aria-labelledby="tdnhv-perms-heading">
        <h3 id="tdnhv-perms-heading">{{ $gettext("Permissions") }}</h3>
        <div class="form-field">
            <label for="tdnhv-perms">{{ $gettext("Actions") }}</label>
            <MultiSelect
                input-id="tdnhv-perms"
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

.hint {
    color: var(--p-text-muted-color);
    font-size: normal;
}
</style>
