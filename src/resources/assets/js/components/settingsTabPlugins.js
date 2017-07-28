/**
 * The plugin component to change the settings whether to show the example annotations.
 *
 * @type {Object}
 */
biigle.$require('annotations.components.settingsTabPlugins').exampleAnnotations = {
    props: {
        settings: {
            type: Object,
            required: true,
        },
    },
    data: function () {
        return {
            isShown: true,
        };
    },
    methods: {
        hide: function () {
            this.isShown = false;
            this.settings.set('exampleAnnotations', false);
        },
        show: function () {
            this.isShown = true;
            this.settings.delete('exampleAnnotations');
        },
    },
    watch: {
        isShown: function (shown) {
            biigle.$require('events').$emit('settings.exampleAnnotations', shown);
        },
    },
    created: function () {
        if (this.settings.has('exampleAnnotations')) {
            this.isShown = this.settings.get('exampleAnnotations');
        }
    },
};
