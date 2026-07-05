<script setup lang="ts">
import { useGettext } from "vue3-gettext";

const { $gettext } = useGettext();
</script>

<template>
    <div class="splash">
        <i
            class="fa fa-shield splash-icon"
            aria-hidden="true"
        />
        <p>{{ $gettext("Select a rule to edit, or create a new one.") }}</p>
    </div>
</template>

<style scoped>
.splash {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 20rem;
    color: var(--p-text-muted-color);
    gap: 1rem;
    font-size: small;
}

.splash-icon {
    font-size: 3rem;
    opacity: 0.4;
}
</style>
