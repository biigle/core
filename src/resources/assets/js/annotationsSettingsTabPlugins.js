import Plugin from './components/annotationsSettingsTabPlugin';
import {SettingsTabPlugins} from './import';

/**
 * The plugin component to change the settings whether to show the example annotations.
 *
 * @type {Object}
 */
if (SettingsTabPlugins) {
    SettingsTabPlugins.exampleAnnotations = Plugin;
}
