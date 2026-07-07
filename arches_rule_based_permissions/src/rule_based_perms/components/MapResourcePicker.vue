<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const props = defineProps<{
    modelValue: string | null | undefined;
    customGeojson?: object | null;
}>();

const emit = defineEmits<{
    "update:modelValue": [value: string | null];
}>();

const mapContainer = ref<HTMLElement | null>(null);
let map: maplibregl.Map | null = null;
let layersReady = false;
const nameMap = ref<Record<string, string>>({});

const SOURCE = "resource-geoms";
const FILL_LAYER = "geoms-fill";
const FILL_OUTLINE_LAYER = "geoms-fill-outline";
const LINE_LAYER = "geoms-line";
const CIRCLE_LAYER = "geoms-circle";
const CLICKABLE_LAYERS = [FILL_LAYER, LINE_LAYER, CIRCLE_LAYER];

const CUSTOM_SOURCE = "custom-geom";
const CUSTOM_FILL_LAYER = "custom-fill";
const CUSTOM_FILL_OUTLINE_LAYER = "custom-fill-outline";
const CUSTOM_LINE_LAYER = "custom-line";
const CUSTOM_CIRCLE_LAYER = "custom-circle";

function wrapGeomAsFC(geom: object | null | undefined): { type: string; features: object[] } {
    if (!geom) return { type: "FeatureCollection", features: [] };
    return { type: "FeatureCollection", features: [{ type: "Feature", geometry: geom, properties: {} }] };
}

// Data-driven paint expressions that highlight the selected resource.
function fillColor(id?: string | null) {
    if (!id) return "#3b82f6";
    return ["case", ["==", ["get", "resource_instance_id"], id], "#ef4444", "#3b82f6"];
}
function fillOpacity(id?: string | null) {
    if (!id) return 0.3;
    return ["case", ["==", ["get", "resource_instance_id"], id], 0.55, 0.25];
}
function lineColor(id?: string | null) {
    if (!id) return "#1d4ed8";
    return ["case", ["==", ["get", "resource_instance_id"], id], "#b91c1c", "#1d4ed8"];
}
function lineWidth(id?: string | null) {
    if (!id) return 1.5;
    return ["case", ["==", ["get", "resource_instance_id"], id], 3, 1.5];
}
function circleColor(id?: string | null) {
    if (!id) return "#3b82f6";
    return ["case", ["==", ["get", "resource_instance_id"], id], "#ef4444", "#3b82f6"];
}
function circleRadius(id?: string | null) {
    if (!id) return 6;
    return ["case", ["==", ["get", "resource_instance_id"], id], 9, 6];
}

function updateLayerStyles(id?: string | null) {
    if (!map || !layersReady) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const set = (layer: string, prop: string, val: any) =>
        map!.setPaintProperty(layer, prop, val);
    set(FILL_LAYER, "fill-color", fillColor(id));
    set(FILL_LAYER, "fill-opacity", fillOpacity(id));
    set(FILL_OUTLINE_LAYER, "line-color", lineColor(id));
    set(FILL_OUTLINE_LAYER, "line-width", lineWidth(id));
    set(LINE_LAYER, "line-color", lineColor(id));
    set(LINE_LAYER, "line-width", lineWidth(id));
    set(CIRCLE_LAYER, "circle-color", circleColor(id));
    set(CIRCLE_LAYER, "circle-radius", circleRadius(id));
}

function addLayersToMap(id?: string | null) {
    map!.addSource(SOURCE, { type: "geojson", data: { type: "FeatureCollection", features: [] } });

    map!.addLayer({
        id: FILL_LAYER,
        type: "fill",
        source: SOURCE,
        filter: ["match", ["geometry-type"], ["Polygon", "MultiPolygon"], true, false],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        paint: { "fill-color": fillColor(id) as any, "fill-opacity": fillOpacity(id) as any },
    });
    map!.addLayer({
        id: FILL_OUTLINE_LAYER,
        type: "line",
        source: SOURCE,
        filter: ["match", ["geometry-type"], ["Polygon", "MultiPolygon"], true, false],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        paint: { "line-color": lineColor(id) as any, "line-width": lineWidth(id) as any },
    });
    map!.addLayer({
        id: LINE_LAYER,
        type: "line",
        source: SOURCE,
        filter: ["match", ["geometry-type"], ["LineString", "MultiLineString"], true, false],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        paint: { "line-color": lineColor(id) as any, "line-width": lineWidth(id) as any },
    });
    map!.addLayer({
        id: CIRCLE_LAYER,
        type: "circle",
        source: SOURCE,
        filter: ["match", ["geometry-type"], ["Point", "MultiPoint"], true, false],
        paint: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            "circle-color": circleColor(id) as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            "circle-radius": circleRadius(id) as any,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#1e3a8a",
        },
    });

    layersReady = true;

    // Custom user-entered GeoJSON geometry (amber/orange)
    map!.addSource(CUSTOM_SOURCE, {
        type: "geojson",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: wrapGeomAsFC(props.customGeojson) as any,
    });
    map!.addLayer({
        id: CUSTOM_FILL_LAYER,
        type: "fill",
        source: CUSTOM_SOURCE,
        filter: ["match", ["geometry-type"], ["Polygon", "MultiPolygon"], true, false],
        paint: { "fill-color": "#f59e0b", "fill-opacity": 0.35 },
    });
    map!.addLayer({
        id: CUSTOM_FILL_OUTLINE_LAYER,
        type: "line",
        source: CUSTOM_SOURCE,
        filter: ["match", ["geometry-type"], ["Polygon", "MultiPolygon"], true, false],
        paint: { "line-color": "#b45309", "line-width": 2 },
    });
    map!.addLayer({
        id: CUSTOM_LINE_LAYER,
        type: "line",
        source: CUSTOM_SOURCE,
        filter: ["match", ["geometry-type"], ["LineString", "MultiLineString"], true, false],
        paint: { "line-color": "#b45309", "line-width": 2 },
    });
    map!.addLayer({
        id: CUSTOM_CIRCLE_LAYER,
        type: "circle",
        source: CUSTOM_SOURCE,
        filter: ["match", ["geometry-type"], ["Point", "MultiPoint"], true, false],
        paint: {
            "circle-color": "#f59e0b",
            "circle-radius": 7,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#b45309",
        },
    });

    for (const layer of CLICKABLE_LAYERS) {
        map!.on("click", layer, (e) => {
            const rid = e.features?.[0]?.properties?.resource_instance_id;
            if (rid) emit("update:modelValue", rid);
        });
        map!.on("mouseenter", layer, () => { map!.getCanvas().style.cursor = "pointer"; });
        map!.on("mouseleave", layer, () => { map!.getCanvas().style.cursor = ""; });
    }
}

function fitToFeatures(geojson: { features: { geometry: unknown }[] }) {
    if (!geojson.features.length) return;
    const bounds = new maplibregl.LngLatBounds();
    for (const feature of geojson.features) {
        extendBounds(bounds, feature.geometry as GeoJSONGeometry);
    }
    if (!bounds.isEmpty()) map!.fitBounds(bounds, { padding: 40, maxZoom: 15 });
}

type GeoJSONGeometry =
    | { type: "Point"; coordinates: number[] }
    | { type: "MultiPoint" | "LineString"; coordinates: number[][] }
    | { type: "MultiLineString" | "Polygon"; coordinates: number[][][] }
    | { type: "MultiPolygon"; coordinates: number[][][][] };

function extendBounds(bounds: maplibregl.LngLatBounds, geom: GeoJSONGeometry) {
    if (!geom) return;
    switch (geom.type) {
        case "Point":
            bounds.extend(geom.coordinates as [number, number]);
            break;
        case "MultiPoint":
        case "LineString":
            for (const c of geom.coordinates) bounds.extend(c as [number, number]);
            break;
        case "MultiLineString":
        case "Polygon":
            for (const ring of geom.coordinates)
                for (const c of ring) bounds.extend(c as [number, number]);
            break;
        case "MultiPolygon":
            for (const poly of geom.coordinates)
                for (const ring of poly)
                    for (const c of ring) bounds.extend(c as [number, number]);
            break;
    }
}

onMounted(() => {
    if (!mapContainer.value) return;

    map = new maplibregl.Map({
        container: mapContainer.value,
        style: {
            version: 8,
            sources: {
                osm: {
                    type: "raster",
                    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                    tileSize: 256,
                    attribution: "© OpenStreetMap contributors",
                    maxzoom: 19,
                },
            },
            layers: [{ id: "osm", type: "raster", source: "osm" }],
        },
        center: [0, 20],
        zoom: 2,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", async () => {
        addLayersToMap(props.modelValue);

        const response = await fetch("/api/rule_config_geometries");
        if (!response.ok) return;
        const geojson = await response.json();

        (map!.getSource(SOURCE) as maplibregl.GeoJSONSource).setData(geojson);
        nameMap.value = Object.fromEntries(
            geojson.features.map((f: { properties: { resource_instance_id: string; name: string } }) => [
                f.properties.resource_instance_id,
                f.properties.name,
            ])
        );
        fitToFeatures(geojson);
        updateLayerStyles(props.modelValue);
    });
});

watch(() => props.modelValue, (newId) => updateLayerStyles(newId));

watch(() => props.customGeojson, (geom) => {
    if (!map || !layersReady) return;
    const fc = wrapGeomAsFC(geom);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (map!.getSource(CUSTOM_SOURCE) as maplibregl.GeoJSONSource).setData(fc as any);
    if (geom && fc.features.length) {
        fitToFeatures(fc as { features: { geometry: unknown }[] });
    }
});

onBeforeUnmount(() => {
    map?.remove();
    map = null;
    layersReady = false;
});
</script>

<template>
    <div class="map-resource-picker">
        <div ref="mapContainer" class="map-container" />
        <div v-if="modelValue" class="selection-bar">
            <span class="selection-label">
                {{ nameMap[modelValue] ?? modelValue }}
            </span>
            <button class="clear-btn" type="button" @click="emit('update:modelValue', null)">
                ✕ Clear
            </button>
        </div>
        <p v-else class="hint">Click a resource on the map to select it.</p>
    </div>
</template>

<style scoped>
.map-resource-picker {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.map-container {
    height: 360px;
    width: 100%;
    border: 1px solid var(--p-surface-300);
    border-radius: 4px;
    overflow: hidden;
}

.selection-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.4rem 0.75rem;
    background: var(--p-surface-100);
    border: 1px solid var(--p-surface-300);
    border-radius: 4px;
    font-size: 0.85em;
}

.selection-label code {
    font-family: monospace;
    word-break: break-all;
}

.clear-btn {
    flex-shrink: 0;
    background: none;
    border: 1px solid var(--p-surface-400);
    border-radius: 4px;
    cursor: pointer;
    padding: 0.15rem 0.5rem;
    font-size: 0.85em;
    color: var(--p-text-muted-color);
}

.clear-btn:hover {
    background: var(--p-surface-200);
}

.hint {
    margin: 0;
    font-size: 0.85em;
    color: var(--p-text-muted-color);
}
</style>
