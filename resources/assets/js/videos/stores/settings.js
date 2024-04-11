import Settings from '../../core/models/Settings';

let defaults = {
    annotationOpacity: 1,
    showMinimap: true,
    autoplayDraw: 0,
    showLabelTooltip: false,
    showMousePosition: false,
    showProgressIndicator: true,
    jumpStep: 5.0,
};

export default new Settings({
    data: {
        urlParams: Object.keys(defaults),
        storageKey: 'biigle.videos.settings',
        defaults: defaults,
    },
});
