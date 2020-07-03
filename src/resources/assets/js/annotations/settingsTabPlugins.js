import Plugin from './components/settingsTabPlugin';
import {SettingsTabPlugins} from './import';

/**
 * The plugin component to edit the export area in the annotation tool.
 *
 * @type {Object}
 */
if (SettingsTabPlugins) {
    SettingsTabPlugins.exportArea = Plugin;
}
