import type { InjectionKey, Ref } from "vue";
import type { RuleConfig, NodeOption, AuthGroup } from "@/rule_based_perms/types.ts";

export const selectedRuleKey = Symbol() as InjectionKey<{
    selectedRule: Ref<RuleConfig | null>;
    setSelectedRule: (rule: RuleConfig | null) => void;
}>;

export const isEditingKey = Symbol() as InjectionKey<{
    isEditing: Ref<boolean>;
    setIsEditing: (val: boolean) => void;
}>;

export const rulesKey = Symbol() as InjectionKey<{
    rules: Ref<RuleConfig[]>;
    rulesLoading: Ref<boolean>;
    loadRules: () => Promise<void>;
}>;

export const nodeOptionsKey = Symbol() as InjectionKey<NodeOption[]>;
export const groupOptionsKey = Symbol() as InjectionKey<AuthGroup[]>;

export const ERROR = "error";
export const SUCCESS = "success";
export const SECONDARY = "secondary";
export const DANGER = "danger";
export const PRIMARY = "primary";
export const DEFAULT_ERROR_TOAST_LIFE = 8000;
