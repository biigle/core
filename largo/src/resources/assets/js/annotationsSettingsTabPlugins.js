import Plugin from './components/annotationsSettingsTabPlugin.vue';
import {SettingsTabPlugins} from './import.js';

/**
 * The plugin component to change the settings whether to show the example annotations.
 *
 * @type {Object}
 */
if (SettingsTabPlugins) {
    SettingsTabPlugins.exampleAnnotations = Plugin;
}
