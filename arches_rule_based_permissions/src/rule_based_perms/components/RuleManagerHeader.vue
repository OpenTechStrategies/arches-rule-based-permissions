<script setup lang="ts">
import { computed, inject } from "vue";
import { useGettext } from "vue3-gettext";

import { selectedRuleKey } from "@/rule_based_perms/constants.ts";

import type { Ref } from "vue";
import type { RuleConfig } from "@/rule_based_perms/types.ts";

const { $gettext } = useGettext();

const { selectedRule } = inject<{ selectedRule: Ref<RuleConfig | null> }>(
    selectedRuleKey,
)!;

const heading = computed(() => {
    if (!selectedRule.value) {
        return $gettext("Permission Rules");
    }
    return $gettext(
        "Permission Rules > %{name}",
        { name: selectedRule.value.name },
        true,
    );
});
</script>

<template>
    <header class="header">
        <i
            class="fa fa-inverse fa-shield"
            aria-hidden="true"
        />
        <h2 style="margin: 1rem">{{ heading }}</h2>
    </header>
</template>

<style scoped>
.header {
    display: flex;
    align-items: center;
    background: var(--p-navigation-header-color);
    color: var(--p-slate-50);
    height: 5.25rem;
}

i {
    margin-inline-start: 1rem;
    margin-top: 0.25rem;
}
</style>
