biigle.$declare('videos.stores.settings', function () {
    let Settings = biigle.$require('core.models.Settings');
    let defaults = {
        annotationOpacity: 1,
        showMinimap: true,
        autoplayDraw: 0,
        showLabelTooltip: false,
        showMousePosition: false,
    };

    return new Settings({
        data: {
            urlParams: Object.keys(defaults),
            storageKey: 'biigle.videos.settings',
            defaults: defaults,
        },
    });
});
