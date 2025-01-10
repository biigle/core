import Settings from '@/core/models/Settings.vue';

let defaults = {
    annotationOpacity: 1,
    showMinimap: true,
    autoplayDraw: 0,
    showLabelTooltip: false,
    showMousePosition: false,
    showProgressIndicator: true,
    showThumbnailPreview: true,
    enableJumpByFrame: false,
    jumpStep: 5.0,
    muteVideo: true,
};

export default new Settings({
    data() {
        return {
            urlParams: Object.keys(defaults),
            storageKey: 'biigle.videos.settings',
            defaults: defaults,
        };
    },
});
