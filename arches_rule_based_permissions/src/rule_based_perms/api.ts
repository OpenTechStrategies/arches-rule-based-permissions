import Cookies from "js-cookie";

import type { RuleConfig, NodeOption, AuthGroup } from "@/rule_based_perms/types.ts";

const RULE_CONFIGS_URL = "/api/rule_configs";
const NODES_URL = "/api/rule_config_nodes";
const GROUPS_URL = "/api/rule_config_groups";
const LIFECYCLE_STATES_URL = "/api/resource_instance_lifecycle/";

let nodeOptionsCache: NodeOption[] | null = null;
let groupOptionsCache: AuthGroup[] | null = null;
let lifecycleStateOptionsCache: LifecycleStateOption[] | null = null;

export interface LifecycleStateOption {
    id: string;
    name: string;
    resource_instance_lifecycle: { name: string };
}

function getToken(): string {
    const token = Cookies.get("csrftoken");
    if (!token) throw new Error("Missing csrftoken");
    return token;
}

async function parseResponse<T>(responsePromise: Promise<Response>): Promise<T> {
    const response = await responsePromise;
    let parsed: Record<string, string>;
    try {
        parsed = await response.json();
    } catch {
        throw new Error(response.statusText);
    }
    if (response.ok) return parsed as T;
    throw new Error((parsed as { message?: string }).message || response.statusText);
}

export const fetchRuleConfigs = (): Promise<RuleConfig[]> =>
    parseResponse(fetch(RULE_CONFIGS_URL));

export const createRuleConfig = (
    data: Omit<RuleConfig, "id" | "groups"> & { group_ids?: number[] },
): Promise<RuleConfig> =>
    parseResponse(
        fetch(RULE_CONFIGS_URL, {
            method: "POST",
            headers: {
                "X-CSRFToken": getToken(),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }),
    );

export const updateRuleConfig = (
    id: string,
    data: Partial<Omit<RuleConfig, "groups">> & { group_ids?: number[] },
): Promise<RuleConfig> =>
    parseResponse(
        fetch(`${RULE_CONFIGS_URL}/${id}`, {
            method: "PATCH",
            headers: {
                "X-CSRFToken": getToken(),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }),
    );

export const deleteRuleConfig = (id: string): Promise<void> =>
    parseResponse(
        fetch(`${RULE_CONFIGS_URL}/${id}`, {
            method: "DELETE",
            headers: { "X-CSRFToken": getToken() },
        }),
    );

export const fetchNodeOptions = async (): Promise<NodeOption[]> => {
    if (!nodeOptionsCache) {
        nodeOptionsCache = await parseResponse(fetch(NODES_URL));
    }
    return nodeOptionsCache;
};

export const fetchGroupOptions = async (): Promise<AuthGroup[]> => {
    if (!groupOptionsCache) {
        groupOptionsCache = await parseResponse(fetch(GROUPS_URL));
    }
    return groupOptionsCache;
};

export const fetchLifecycleStateOptions = async (): Promise<LifecycleStateOption[]> => {
    if (!lifecycleStateOptionsCache) {
        lifecycleStateOptionsCache = await parseResponse(fetch(LIFECYCLE_STATES_URL));
    }
    return lifecycleStateOptionsCache;
};
