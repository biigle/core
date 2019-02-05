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
                'showLabelTooltip',
                'showMousePosition',
            ],
            annotationOpacity: 1,
            showMinimap: true,
            autoplayDraw: 0,
            showLabelTooltip: false,
            showMousePosition: false,
            playbackRate: 1.0,
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
        handleShowLabelTooltip: function () {
            this.showLabelTooltip = true;
        },
        handleHideLabelTooltip: function () {
            this.showLabelTooltip = false;
        },
        handleShowMousePosition: function () {
            this.showMousePosition = true;
        },
        handleHideMousePosition: function () {
            this.showMousePosition = false;
        },
    },
    watch: {
        annotationOpacity: function (value) {
            value = parseFloat(value);
            if (!isNaN(value)) {
                this.$emit('update', 'annotationOpacity', value);
                this.settings.set('annotationOpacity', value);
            }
        },
        showMinimap: function (show) {
            this.$emit('update', 'showMinimap', show);
            this.settings.set('showMinimap', show);
        },
        autoplayDraw: function (value) {
            value = parseFloat(value);
            this.$emit('update', 'autoplayDraw', value);
            this.settings.set('autoplayDraw', value);
        },
        showLabelTooltip: function (show) {
            this.$emit('update', 'showLabelTooltip', show);
            this.settings.set('showLabelTooltip', show);
        },
        showMousePosition: function (show) {
            this.$emit('update', 'showMousePosition', show);
            this.settings.set('showMousePosition', show);
        },
        playbackRate: function (value) {
            value = parseFloat(value);
            if (!isNaN(value)) {
                this.$emit('update', 'playbackRate', value);
            }
        },
    },
    created: function () {
        this.restoreKeys.forEach(function (key) {
            this[key] = this.settings.get(key);
        }, this);
    },
});
