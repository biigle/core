import Plugin from './components/annotationsSettingsTabPlugin.vue';
import {plugins} from '@/annotations/components/settingsTab.vue';

/**
 * The plugin component to change the settings whether to show the example annotations.
 *
 * @type {Object}
 */
if (plugins) {
    plugins.exampleAnnotations = Plugin;
}
