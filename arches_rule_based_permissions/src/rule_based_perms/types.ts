export interface RuleConfig {
    id: string;
    name: string;
    type: string;
    active: boolean;
    node_id: string | null;
    nodegroup_id: string | null;
    value: RuleValue | null;
    groups: AuthGroup[];
    actions: string[];
}

/** Generic value shape — use the narrower types below for type-specific components */
export type RuleValue = TileHasValueParams | LifecycleStateParams | SpatialParams;

export interface TileHasValueParams {
    value: string;
    op: string;
}

export interface LifecycleStateParams {
    value: string[];
}

export interface SpatialParams {
    geojson: object | null;
    op: string;
    resource_instance_id?: string | null;
}

export interface AuthGroup {
    id: number;
    name: string;
}

export interface NodeOption {
    id: string;
    name: string;
    nodegroup_id: string | null;
    graph_name: string;
    datatype: string;
}
