<script>
import ModifyPolygonBrushInteraction from '@/annotations/ol/interaction/ModifyPolygonBrush.js';
import PolygonBrushInteraction from '@/annotations/ol/interaction/PolygonBrush.js';
import SelectInteraction from '@biigle/ol/interaction/Select';
import Styles from '@/annotations/stores/styles.js';
import {altKeyOnly as altKeyOnlyCondition} from '@biigle/ol/events/condition';
import {click as clickCondition} from '@biigle/ol/events/condition';
import {never as neverCondition} from '@biigle/ol/events/condition';
import {noModifierKeys as noModifierKeysCondition} from '@biigle/ol/events/condition';
import {shiftKeyOnly as shiftKeyOnlyCondition} from '@biigle/ol/events/condition';
import { setOrUnsetProperty } from '../../../utils';

/**
 * Mixin for the videoScreen component that contains logic for the polygon brush
 * interactions.
 *
 * @type {Object}
 */
export default {
    data() {
        return {
            polygonBrushRadius: 50,
            currentInteraction: null,
        };
    },
    computed: {
        isUsingPolygonBrush() {
            return this.interactionMode === 'polygonBrush';
        },
        isUsingPolygonEraser() {
            return this.interactionMode === 'polygonEraser';
        },
        isUsingPolygonFill() {
            return this.interactionMode === 'polygonFill';
        },
    },
    methods: {
        togglePolygonBrush() {
            if (this.isUsingPolygonBrush) {
                this.resetInteractionMode();
                this.currentInteraction = null;
            } else if (!this.hasSelectedLabel) {
                this.requireSelectedLabel();
            } else if (this.canAdd) {
                this.interactionMode = 'polygonBrush';
            }
        },
        togglePolygonEraser() {
            if (this.isUsingPolygonEraser) {
                this.resetInteractionMode();
                this.currentInteraction = null;
            } else if (this.canModify) {
                this.interactionMode = 'polygonEraser';
            }
        },
        togglePolygonFill() {
            if (this.isUsingPolygonFill) {
                this.resetInteractionMode();
                this.currentInteraction = null;
            } else if (this.canModify) {
                this.interactionMode = 'polygonFill';
            }
        },
        togglePolygonBrushInteraction(isUsingPolygonBrush) {
            if (!isUsingPolygonBrush) {
                this.polygonBrushRadius = this.polygonBrushInteraction.getBrushRadius();
                this.map.removeInteraction(this.polygonBrushInteraction);
            } else if (this.hasSelectedLabel) {
                this.polygonBrushInteraction = new PolygonBrushInteraction({
                    source: this.pendingAnnotationSource,
                    style: Styles.editing,
                    brushRadius: this.polygonBrushRadius,
                    resizeCondition: altKeyOnlyCondition,
                    draftColor: this.getDraftColor()
                });
                this.currentInteraction = this.polygonBrushInteraction;
                this.polygonBrushInteraction.on('drawend', this.extendPendingAnnotation);
                this.pendingAnnotation.shape = 'Polygon';
                this.map.addInteraction(this.polygonBrushInteraction);
                this.updatePolygonBrushDraftColor();
            }
        },
        togglePolygonEraserInteraction(isUsingPolygonEraser) {
            if (!isUsingPolygonEraser) {
                this.polygonBrushRadius = this.polygonEraserInteraction.getBrushRadius();
                this.map.removeInteraction(this.polygonEraserInteraction);
                this.polygonEraserInteraction = null;
                this.map.removeInteraction(this.shiftClickSelectInteraction);
            } else {
                this.polygonEraserInteraction = new ModifyPolygonBrushInteraction({
                    features: this.selectInteraction.getFeatures(),
                    style: Styles.editing,
                    brushRadius: this.polygonBrushRadius,
                    allowRemove: false,
                    addCondition: neverCondition,
                    subtractCondition: noModifierKeysCondition,
                    resizeCondition: altKeyOnlyCondition,
                    draftColor: this.getDraftColor()
                });
                this.currentInteraction = this.polygonEraserInteraction;
                this.polygonEraserInteraction.on('modifystart', this.handleModifyStart);
                this.polygonEraserInteraction.on('modifyend', this.handleModifyEnd);
                this.map.addInteraction(this.polygonEraserInteraction);
                this.map.addInteraction(this.shiftClickSelectInteraction);
                this.updatePolygonBrushDraftColor();
            }
        },
        togglePolygonFillInteraction(isUsingPolygonFill) {
            if (!isUsingPolygonFill) {
                this.polygonBrushRadius = this.polygonFillInteraction.getBrushRadius();
                this.map.removeInteraction(this.polygonFillInteraction);
                this.polygonFillInteraction = null;
                this.map.removeInteraction(this.shiftClickSelectInteraction);
            } else {
                this.polygonFillInteraction = new ModifyPolygonBrushInteraction({
                    features: this.selectInteraction.getFeatures(),
                    style: Styles.editing,
                    brushRadius: this.polygonBrushRadius,
                    allowRemove: false,
                    addCondition: noModifierKeysCondition,
                    subtractCondition: neverCondition,
                    resizeCondition: altKeyOnlyCondition,
                    draftColor: this.getDraftColor()
                });
                this.currentInteraction = this.polygonFillInteraction;
                this.polygonFillInteraction.on('modifystart', this.handleModifyStart);
                this.polygonFillInteraction.on('modifyend', this.handleModifyEnd);
                this.map.addInteraction(this.polygonFillInteraction);
                this.map.addInteraction(this.shiftClickSelectInteraction);
                this.updatePolygonBrushDraftColor();
            }
        },
        initShiftSelectInteraction() {
            this.shiftClickSelectInteraction = new SelectInteraction({
                condition(e) {
                    return clickCondition(e) && shiftKeyOnlyCondition(e);
                },
                style: Styles.highlight,
                layers: [this.annotationLayer],
                features: this.selectInteraction.getFeatures(),
                multi: true,
            });
            this.shiftClickSelectInteraction.on('select', this.handleFeatureSelect);
        },
        getDraftColor() {
            return this.draftAnnotationUsesLabelColor && this.selectedLabel ? this.selectedLabel?.color : null;
        },
        updatePolygonBrushDraftColor() {
            const draftColor = this.getDraftColor();

            this.currentInteraction?.setDraftColor?.(draftColor);
            this.pendingAnnotationSource?.getFeatures().forEach( (feature) => {
                setOrUnsetProperty(feature, 'color', draftColor);
            });
        }
    },
    watch: {
        selectedLabel() {
            this.updatePolygonBrushDraftColor();
        },
        draftAnnotationUsesLabelColor() {
            this.updatePolygonBrushDraftColor();
        },
    },
    created() {
        if (this.canAdd) {
            this.$watch('isUsingPolygonBrush', this.togglePolygonBrushInteraction);
            this.keyboardOn('e', this.togglePolygonBrush, 0, this.listenerSet);
        }

        if (this.canModify) {
            this.$watch('mapReadyRevision', {
                once: true,
                handler() {
                    this.initShiftSelectInteraction(this.map);
                },
            });

            this.$watch('isUsingPolygonEraser', this.togglePolygonEraserInteraction);
            this.keyboardOn('r', this.togglePolygonEraser, 0, this.listenerSet);
            this.$watch('isUsingPolygonFill', this.togglePolygonFillInteraction);
            this.keyboardOn('t', this.togglePolygonFill, 0, this.listenerSet);
        }
    },
};
</script>
