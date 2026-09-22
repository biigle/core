import Settings from '@/core/models/Settings.js';
import {TIMEOUTS} from '@/annotations/components/labelbotPopup.vue';
import {LABEL_TOOLTIP_MODES} from '@/annotations/utils.js';

let defaults = {
    annotationOpacity: 1,
    showMinimap: true,
    autoplayDraw: 0,
    autoPause: 0,
    showLabelTooltip: LABEL_TOOLTIP_MODES.OFF,
    showMousePosition: false,
    showProgressIndicator: true,
    showThumbnailPreview: true,
    enableJumpByFrame: false,
    jumpStep: 5.0,
    muteVideo: true,
    singleAnnotation: false,
    labelbotTimeout: TIMEOUTS.length - 1, // off
    draftAnnotationUsesLabelColor: true,
};

export default new Settings({
    urlParams: Object.keys(defaults),
    storageKey: 'biigle.videos.settings',
    defaults: defaults,
});
