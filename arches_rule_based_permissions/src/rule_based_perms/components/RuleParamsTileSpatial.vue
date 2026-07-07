<script setup lang="ts">
import { computed, inject } from "vue";
import { useGettext } from "vue3-gettext";

import MultiSelect from "primevue/multiselect";
import Select from "primevue/select";
import Textarea from "primevue/textarea";

import MapResourcePicker from "@/rule_based_perms/components/MapResourcePicker.vue";
import { isEditingKey } from "@/rule_based_perms/constants.ts";
import type { RuleConfig, SpatialParams } from "@/rule_based_perms/types.ts";

const props = defineProps<{
    formData: RuleConfig;
}>();

const { setIsEditing } = inject(isEditingKey)!;
const { $gettext } = useGettext();

const GEO_OP_OPTIONS = [
    { label: $gettext("intersects"), value: "intersects" },
    { label: $gettext("within"), value: "within" },
    { label: $gettext("contains"), value: "contains" },
    { label: $gettext("disjoint"), value: "disjoint" },
];

const ACTION_OPTIONS = [
    { label: $gettext("Read"), value: "view_resourceinstance" },
    { label: $gettext("Update"), value: "change_resourceinstance" },
    { label: $gettext("Delete"), value: "delete_resourceinstance" },
];

const params = computed(() => props.formData.value as SpatialParams);

const geojsonText = computed({
    get: () =>
        params.value?.geojson ? JSON.stringify(params.value.geojson, null, 2) : "",
    set: (text: string) => {
        try {
            (props.formData.value as SpatialParams).geojson = text
                ? JSON.parse(text)
                : null;
        } catch {
            // Leave invalid JSON as-is while the user is still typing
        }
    },
});
</script>

<template>
    <section class="form-section" aria-labelledby="sp-heading">
        <h3 id="sp-heading">{{ $gettext("Spatial Filter") }}</h3>

        <div class="form-field">
            <label for="sp-op">{{ $gettext("Operation") }}</label>
            <Select
                input-id="sp-op"
                v-model="params.op"
                :options="GEO_OP_OPTIONS"
                option-label="label"
                option-value="value"
                style="width: 100%"
                @update:model-value="setIsEditing(true)"
            />
        </div>

        <div class="form-field">
            <label>{{ $gettext("Resource") }}</label>
            <MapResourcePicker
                v-model="params.resource_instance_id"
                @update:model-value="setIsEditing(true)"
            />
        </div>

        <div v-if="!params.resource_instance_id" class="form-field">
            <label for="sp-geojson">{{ $gettext("GeoJSON") }}</label>
            <Textarea
                id="sp-geojson"
                v-model="geojsonText"
                :placeholder="$gettext('Paste a GeoJSON geometry object here')"
                :rows="6"
                style="width: 100%; font-family: monospace; font-size: 0.85em"
                @update:model-value="setIsEditing(true)"
            />
        </div>
    </section>

    <!-- Permissions -->
    <section class="form-section" aria-labelledby="sp-perms-heading">
        <h3 id="sp-perms-heading">{{ $gettext("Permissions") }}</h3>
        <div class="form-field">
            <label for="sp-perms">{{ $gettext("Actions") }}</label>
            <MultiSelect
                input-id="sp-perms"
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

label {
    font-weight: 600;
    color: var(--p-text-muted-color);
}

.hint {
    color: var(--p-text-muted-color);
    font-family: monospace;
    font-size: 0.85em;
}
</style>
