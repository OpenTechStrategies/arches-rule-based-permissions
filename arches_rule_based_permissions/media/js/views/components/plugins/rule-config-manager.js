import ko from 'knockout';

import { definePreset, palette } from '@primeuix/themes';
import { ArchesPreset, DEFAULT_THEME } from '@/arches/themes/default.ts';
import { routes } from '@/rule_based_perms/routes.ts';
import RuleConfigManager from '@/rule_based_perms/plugins/RuleConfigManager.vue';
import createVueApplication from 'utils/create-vue-application';
import RuleConfigManagerTemplate from 'templates/views/components/plugins/rule-config-manager.htm';

import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes,
});

const RuleConfigPreset = definePreset(ArchesPreset, {
    semantic: {
        iconSize: '1.2rem',
        colorScheme: {
            light: {
                primary: palette(ArchesPreset.primitive.arches.blue),
                dialog: {
                    headerTextColor: '{slate.50}',
                },
            },
            dark: {
                dialog: {
                    headerTextColor: '{slate.50}',
                },
            },
        },
    },
    components: {
        button: {
            colorScheme: {
                light: {
                    primary: {
                        background: '{primary-800}',
                        borderColor: '{button-primary-background}',
                    },
                    danger: {
                        background: '{orange-700}',
                        borderColor: '{orange-700}',
                        hover: {
                            background: '{orange-500}',
                            borderColor: '{orange-500}',
                        },
                    },
                },
            },
            root: {
                label: { fontWeight: 600 },
            },
            border: { radius: '.25rem' },
        },
        toast: {
            summary: { fontSize: '1.5rem' },
            detail: { fontSize: '1.25rem' },
        },
    },
});

const RuleConfigTheme = {
    theme: {
        ...DEFAULT_THEME.theme,
        preset: RuleConfigPreset,
    },
};

ko.components.register('rule-config-manager', {
    viewModel: function() {
        createVueApplication(RuleConfigManager, RuleConfigTheme).then((vueApp) => {
            vueApp.use(router);
            vueApp.mount('#rule-config-manager-mounting-point');
        });
    },
    template: RuleConfigManagerTemplate,
});
