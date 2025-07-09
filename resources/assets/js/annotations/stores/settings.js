import Settings from '@/core/models/Settings.js';

/**
 * Store for annotator settings
 */

// Take care when modifying these variable names as they are mentioned as
// configurable URL parameters in the documentation.
let defaults = {
    // Settings tab.
    annotationOpacity: 1.0,
    cachedImagesCount: 1,
    mousePosition: false,
    zoomLevel: false,
    scaleLine: false,
    labelTooltip: false,
    measureTooltip: false,
    minimap: true,
    progressIndicator: true,
    exampleAnnotations: true,
    restrictToBounds: false,
    // Annotation modes tab.
    randomSamplingNumber: 9,
    regularSamplingRows: 3,
    regularSamplingColumns: 3,
};

export default new Settings({
    urlParams: Object.keys(defaults),
    storageKey: 'biigle.annotations.settings',
    defaults: defaults,
});
