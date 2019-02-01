biigle.$component('videos.components.settingsTab', {
    props: {
        //
    },
    data: function () {
        return {
            restoreKeys: [
                'annotationOpacity',
                'autoplayDraw',
            ],
            annotationOpacity: 1,
            autoplayDraw: 0,
        };
    },
    computed: {
        settings: function () {
            return biigle.$require('videos.settings');
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
        autoplayDraw: function (opacity) {
            opacity = parseFloat(opacity);
            this.$emit('update', 'autoplayDraw', opacity);
            this.settings.set('autoplayDraw', opacity);
        },
    },
    created: function () {
        this.restoreKeys.forEach(function (key) {
            this[key] = this.settings.get(key);
        }, this);
    },
});
