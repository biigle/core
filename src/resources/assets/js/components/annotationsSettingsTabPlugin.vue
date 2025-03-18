<script>
import {Events} from '../import.js';
import {PowerToggle} from '../import.js';

/**
 * The plugin component to change the settings whether to show the example annotations.
 *
 * @type {Object}
 */
export default {
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
            Events.emit('settings.exampleAnnotations', shown);
        },
    },
    created() {
        if (this.settings.has('exampleAnnotations')) {
            this.isShown = this.settings.get('exampleAnnotations');
        }
    },
};
</script>
