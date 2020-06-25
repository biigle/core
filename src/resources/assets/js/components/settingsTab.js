biigle.$component('videos.components.settingsTab', {
    components: {
        powerToggle: biigle.$require('core.components.powerToggle'),
    },
    props: {
        //
    },
    data() {
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
        settings() {
            return biigle.$require('videos.stores.settings');
        },
    },
    methods: {
        handleShowMinimap() {
            this.showMinimap = true;
        },
        handleHideMinimap() {
            this.showMinimap = false;
        },
        handleShowLabelTooltip() {
            this.showLabelTooltip = true;
        },
        handleHideLabelTooltip() {
            this.showLabelTooltip = false;
        },
        handleShowMousePosition() {
            this.showMousePosition = true;
        },
        handleHideMousePosition() {
            this.showMousePosition = false;
        },
    },
    watch: {
        annotationOpacity(value) {
            value = parseFloat(value);
            if (!isNaN(value)) {
                this.$emit('update', 'annotationOpacity', value);
                this.settings.set('annotationOpacity', value);
            }
        },
        showMinimap(show) {
            this.$emit('update', 'showMinimap', show);
            this.settings.set('showMinimap', show);
        },
        autoplayDraw(value) {
            value = parseFloat(value);
            this.$emit('update', 'autoplayDraw', value);
            this.settings.set('autoplayDraw', value);
        },
        showLabelTooltip(show) {
            this.$emit('update', 'showLabelTooltip', show);
            this.settings.set('showLabelTooltip', show);
        },
        showMousePosition(show) {
            this.$emit('update', 'showMousePosition', show);
            this.settings.set('showMousePosition', show);
        },
        playbackRate(value) {
            value = parseFloat(value);
            if (!isNaN(value)) {
                this.$emit('update', 'playbackRate', value);
            }
        },
    },
    created() {
        this.restoreKeys.forEach(function (key) {
            this[key] = this.settings.get(key);
        }, this);
    },
});
