biigle.$component('videos.components.settingsTab', {
    components: {
        powerToggle: biigle.$require('core.components.powerToggle'),
    },
    props: {
        //
    },
    data: function () {
        return {
            restoreKeys: [
                'annotationOpacity',
                'showMinimap',
                'autoplayDraw',
            ],
            annotationOpacity: 1,
            showMinimap: true,
            autoplayDraw: 0,
        };
    },
    computed: {
        settings: function () {
            return biigle.$require('videos.settings');
        },
    },
    methods: {
        handleShowMinimap: function () {
            this.showMinimap = true;
        },
        handleHideMinimap: function () {
            this.showMinimap = false;
        },
    },
    watch: {
        annotationOpacity: function (opacity) {
            opacity = parseFloat(opacity);
            this.$emit('update', 'annotationOpacity', opacity);
            this.settings.set('annotationOpacity', opacity);
        },
        showMinimap: function (show) {
            this.$emit('update', 'showMinimap', show);
            this.settings.set('showMinimap', show);
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
