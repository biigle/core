import Settings from '../../core/models/Settings';

let defaults = {
    annotationOpacity: 1,
    showMinimap: true,
    autoplayDraw: 0,
    showLabelTooltip: false,
    showMousePosition: false,
    showProgressIndicator: true,
    enableJumpByFrame: false,
    jumpStep: 5.0,
    muteVideo: true,
};

export default new Settings({
    data: {
        urlParams: Object.keys(defaults),
        storageKey: 'biigle.videos.settings',
        defaults: defaults,
    },
});
