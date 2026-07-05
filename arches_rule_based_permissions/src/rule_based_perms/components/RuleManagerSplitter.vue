<script setup lang="ts">
import { inject } from "vue";
import { useGettext } from "vue3-gettext";

import ProgressSpinner from "primevue/progressspinner";
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import Tag from "primevue/tag";
import ToggleSwitch from "primevue/toggleswitch";

import { selectedRuleKey, isEditingKey } from "@/rule_based_perms/constants.ts";

import RuleList from "@/rule_based_perms/components/RuleList.vue";
import RuleEditor from "@/rule_based_perms/components/RuleEditor.vue";
import RuleSplash from "@/rule_based_perms/components/RuleSplash.vue";

import type { Ref } from "vue";
import type { RuleConfig } from "@/rule_based_perms/types.ts";

const { $gettext } = useGettext();

const { selectedRule } = inject<{ selectedRule: Ref<RuleConfig | null> }>(
    selectedRuleKey,
)!;

const { setIsEditing } = inject<{
    isEditing: Ref<boolean>;
    setIsEditing: (val: boolean) => void;
}>(isEditingKey)!;

const TYPE_LABELS: Record<string, string> = {
    filter_tile_has_value: "Tile Has Value",
    filter_tile_does_not_have_value: "Tile Does Not Have Value",
    filter_resource_has_lifecycle_state: "Resource Has Lifecycle State",
    filter_tile_spatial: "Tile Spatial",
};
</script>

<template>
    <Splitter>
        <SplitterPanel
            :size="30"
            :min-size="20"
            style="display: flex; flex-direction: column"
        >
            <RuleList />
        </SplitterPanel>
        <SplitterPanel
            :size="70"
            :min-size="30"
            style="display: flex; flex-direction: column; overflow: hidden"
        >
            <div v-if="selectedRule" class="editor-panel-header">
                <span>{{ TYPE_LABELS[selectedRule.type] ?? selectedRule.type }}</span>
                <div class="header-active">
                    <ToggleSwitch
                        v-model="selectedRule.active"
                        input-id="header-rule-active"
                        @update:model-value="setIsEditing(true)"
                    />
                    <Tag
                        v-if="selectedRule.active"
                        :value="$gettext('Active')"
                        severity="success"
                        style="font-size: x-small"
                    />
                    <Tag
                        v-else
                        :value="$gettext('Inactive')"
                        severity="secondary"
                        style="font-size: x-small"
                    />
                </div>
            </div>
            <div style="flex: 1; overflow-y: auto; margin: 0 0 4rem 1rem; padding-right: 2rem">
                <RuleSplash v-if="!selectedRule" />
                <Suspense v-else>
                    <RuleEditor />
                    <template #fallback>
                        <div role="status" :aria-label="$gettext('Loading rule editor')">
                            <ProgressSpinner aria-hidden="true" />
                        </div>
                    </template>
                </Suspense>
            </div>
        </SplitterPanel>
    </Splitter>
</template>

<style scoped>
.p-splitter {
    height: 100%;
    overflow: hidden;
    border-radius: 0;
}

.editor-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.5rem;
    background: var(--p-surface-50);
    border-bottom: 1px solid var(--p-surface-200);
    font-size: larger;
    font-weight: 550;
    flex-shrink: 0;
}

.header-active {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: small;
    font-weight: 600;
    color: var(--p-text-muted-color);
}
</style>
