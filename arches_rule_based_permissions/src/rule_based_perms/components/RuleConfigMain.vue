<script setup lang="ts">
import { onMounted, provide, ref } from "vue";
import { useRouter } from "vue-router";
import { useGettext } from "vue3-gettext";
import { useConfirm } from "primevue/useconfirm";
import ConfirmDialog from "primevue/confirmdialog";
import Toast from "primevue/toast";

import {
    selectedRuleKey,
    isEditingKey,
    rulesKey,
    DANGER,
    SECONDARY,
} from "@/rule_based_perms/constants.ts";
import { routeNames } from "@/rule_based_perms/routes.ts";
import { fetchRuleConfigs } from "@/rule_based_perms/api.ts";

import RuleManagerHeader from "@/rule_based_perms/components/RuleManagerHeader.vue";
import RuleManagerSplitter from "@/rule_based_perms/components/RuleManagerSplitter.vue";

import type { Ref } from "vue";
import type { RuleConfig } from "@/rule_based_perms/types.ts";

const router = useRouter();
const confirm = useConfirm();
const { $gettext } = useGettext();

const selectedRule: Ref<RuleConfig | null> = ref(null);
const isEditing = ref(false);

const rules: Ref<RuleConfig[]> = ref([]);
const rulesLoading = ref(false);

const loadRules = async () => {
    rulesLoading.value = true;
    try {
        rules.value = await fetchRuleConfigs();
    } finally {
        rulesLoading.value = false;
    }
};

onMounted(loadRules);

function setIsEditing(val: boolean) {
    isEditing.value = val;
}

const setSelectedRule = (rule: RuleConfig | null) => {
    if (isEditing.value) {
        confirm.require({
            message: $gettext(
                "You have unsaved changes. Are you sure you want to leave?",
            ),
            header: $gettext("Unsaved changes"),
            icon: "fa fa-exclamation-triangle",
            acceptProps: {
                label: $gettext("Exit without saving"),
                severity: DANGER,
                style: { fontSize: "small" },
            },
            rejectProps: {
                label: $gettext("Go back"),
                severity: SECONDARY,
                style: { fontSize: "small" },
            },
            accept: () => {
                isEditing.value = false;
                finishSelectingRule(rule);
            },
        });
    } else {
        finishSelectingRule(rule);
    }
};

const finishSelectingRule = (rule: RuleConfig | null) => {
    selectedRule.value = rule;
    if (rule === null) {
        router.push({ name: routeNames.splash });
    } else {
        router.push({ name: routeNames.rule, params: { id: rule.id } });
    }
};

provide(selectedRuleKey, { selectedRule, setSelectedRule });
provide(isEditingKey, { isEditing, setIsEditing });
provide(rulesKey, { rules, rulesLoading, loadRules });
</script>

<template>
    <div style="height: 100vh; padding-bottom: 2.5rem">
        <div class="rule-manager-container">
            <RuleManagerHeader />
            <RuleManagerSplitter />
        </div>
    </div>
    <Toast
        :pt="{
            root: { style: { minWidth: '50rem' } },
            messageIcon: { style: { marginTop: 'var(--p-toast-text-gap)' } },
        }"
    />
    <ConfirmDialog
        style="border-radius: 0rem"
        :draggable="false"
        :pt="{
            header: {
                style: {
                    background: 'var(--p-navigation-header-color)',
                    color: 'white',
                    borderRadius: '0rem',
                    marginBottom: '2rem',
                },
            },
            footer: { style: { marginTop: '2rem' } },
            title: { style: { fontWeight: 800, fontSize: 'small' } },
        }"
    />
</template>

<style scoped>
.rule-manager-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

:deep(h2) {
    font-size: medium;
}

:deep(h3) {
    font-size: medium;
}

:deep(h4) {
    font-size: small;
}

:deep(.p-inputtext) {
    font-size: 1.2rem;
}
</style>
