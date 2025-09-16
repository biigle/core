import Settings from '@/core/models/Settings.js';

let defaults = {
    annotationOpacity: 1,
    showMinimap: true,
    autoplayDraw: 0,
    autoPause: 0,
    showLabelTooltip: false,
    showMousePosition: false,
    showProgressIndicator: true,
    showThumbnailPreview: true,
    enableJumpByFrame: false,
    jumpStep: 5.0,
    muteVideo: true,
    singleAnnotation: false,
};

export default new Settings({
    urlParams: Object.keys(defaults),
    storageKey: 'biigle.videos.settings',
    defaults: defaults,
});
