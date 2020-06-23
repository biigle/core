import {Events} from './import';
import {PowerToggle} from './import';
import {SettingsTabPlugins} from './import';

/**
 * The plugin component to change the settings whether to show the example annotations.
 *
 * @type {Object}
 */
if (SettingsTabPlugins) {
    SettingsTabPlugins.exampleAnnotations = {
        components: {
            powerButton: PowerToggle,
        },
        props: {
            settings: {
                type: Object,
                required: true,
            },
        },
        data() {
            return {
                isShown: true,
            };
        },
        methods: {
            hide() {
                this.isShown = false;
                this.settings.set('exampleAnnotations', false);
            },
            show() {
                this.isShown = true;
                this.settings.delete('exampleAnnotations');
            },
        },
        watch: {
            isShown(shown) {
                Events.$emit('settings.exampleAnnotations', shown);
            },
        },
        created() {
            if (this.settings.has('exampleAnnotations')) {
                this.isShown = this.settings.get('exampleAnnotations');
            }
        },
    };
}
