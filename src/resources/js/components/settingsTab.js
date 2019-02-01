biigle.$component('videos.components.settingsTab', {
    props: {
        //
    },
    data: function () {
        return {
            defaults: {
                annotationOpacity: 1,
            },
            annotationOpacity: 1,
        };
    },
    computed: {
        settings: function () {
            var Settings = biigle.$require('core.models.Settings');

            return new Settings({
                data: {
                    urlParams: Object.keys(this.defaults),
                    storageKey: 'biigle.videos.settings',
                    defaults: this.defaults,
                },
            });
        },
    },
    methods: {
        //
    },
    watch: {
        annotationOpacity: function (opacity) {
            opacity = parseFloat(opacity);
            this.$emit('update', 'annotationOpacity', opacity);
            this.settings.set('annotationOpacity', opacity);
        },
    },
    created: function () {
        Object.keys(this.defaults).forEach(function (key) {
            this[key] = this.settings.get(key);
        }, this);
    },
});
