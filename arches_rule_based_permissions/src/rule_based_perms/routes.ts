import arches from "arches";
import RuleConfigMain from "@/rule_based_perms/components/RuleConfigMain.vue";

export const routes = [
    {
        path: arches.urls.plugin("rule-config-manager"),
        name: "splash",
        component: RuleConfigMain,
    },
    {
        path: arches.urls.plugin("rule-config-manager/:id"),
        name: "rule",
        component: RuleConfigMain,
    },
];

export const routeNames = {
    splash: "splash",
    rule: "rule",
};
