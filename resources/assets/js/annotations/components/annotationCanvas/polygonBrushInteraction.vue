<script>
import Keyboard from '../../../core/keyboard';
import ModifyPolygonBrushInteraction from '@biigle/ol/interaction/ModifyPolygonBrush';
import PolygonBrushInteraction from '@biigle/ol/interaction/PolygonBrush';
import SelectInteraction from '@biigle/ol/interaction/Select';
import Styles from '../../stores/styles';
import { never, noModifierKeys, click, shiftKeyOnly, altKeyOnly } from '@biigle/ol/events/condition';

/**
 * Mixin for the annotationCanvas component that contains logic for the polygon brush interaction.
 *
 * @type {Object}
 */
let brushRadius = 50;
let shiftClickSelectInteraction;
let currentInteraction;

export default {
    computed: {
        isUsingPolygonBrush() {
            return this.interactionMode === 'polygonBrush';
        },
        isUsingPolygonEraser() {
            return this.interactionMode === 'polygonEraser';
        },
        isUsingPolygonFill() {
            return this.interactionMode === 'polygonFill';
        }
    },
    methods: {
        togglePolygonBrush() {
            if (this.isUsingPolygonBrush) {
                this.resetInteractionMode();
            } else if (!this.hasSelectedLabel && this.canAdd) {
                this.requireSelectedLabel();
            } else if (this.canAdd) {
                this.interactionMode = 'polygonBrush';
            }
        },
        togglePolygonEraser() {
            if (this.isUsingPolygonEraser) {
                this.resetInteractionMode();
            } else if (this.canModify) {
                this.interactionMode = 'polygonEraser';
            }
        },
        togglePolygonFill() {
            if (this.isUsingPolygonFill) {
                this.resetInteractionMode();
            } else if (this.canModify) {
                this.interactionMode = 'polygonFill';
            }
        },
        toggleCurrentInteraction(mode) {
            if (currentInteraction) {
                brushRadius = currentInteraction.getBrushRadius();
                this.map.removeInteraction(currentInteraction);
                currentInteraction = null;
            }

            if (this.canAdd && mode === 'polygonBrush') {
                currentInteraction = new PolygonBrushInteraction({
                    map: this.map,
                    source: this.annotationSource,
                    style: Styles.editing,
                    brushRadius: brushRadius,
                    resizeCondition: altKeyOnly,
                });
                currentInteraction.on('drawend', this.handleNewFeature);
                this.map.addInteraction(currentInteraction);
            } else if (this.canModify && mode === 'polygonEraser') {
                currentInteraction = new ModifyPolygonBrushInteraction({
                    map: this.map,
                    features: this.selectInteraction.getFeatures(),
                    style: Styles.editing,
                    brushRadius: brushRadius,
                    allowRemove: false,
                    addCondition: never,
                    subtractCondition: noModifierKeys,
                    resizeCondition: altKeyOnly,
                });
                currentInteraction.on('modifystart', this.handleFeatureModifyStart);
                currentInteraction.on('modifyend', this.handleFeatureModifyEnd);
                this.map.addInteraction(currentInteraction);
                this.map.addInteraction(shiftClickSelectInteraction);
            } else if (this.canModify && mode === 'polygonFill') {
                currentInteraction = new ModifyPolygonBrushInteraction({
                    map: this.map,
                    features: this.selectInteraction.getFeatures(),
                    style: Styles.editing,
                    brushRadius: brushRadius,
                    addCondition: noModifierKeys,
                    subtractCondition: never,
                    resizeCondition: altKeyOnly,
                });
                currentInteraction.on('modifystart', this.handleFeatureModifyStart);
                currentInteraction.on('modifyend', this.handleFeatureModifyEnd);
                this.map.addInteraction(currentInteraction);
                this.map.addInteraction(shiftClickSelectInteraction);
            }
        },
        toggleShiftClickSelectInteraction(mode) {
            let canUsePolygonBrush = this.canAdd && (mode === 'polygonBrush');
            let canUsePolygonTools = this.canModify && (mode === 'polygonEraser' || mode === 'polygonFill');

            shiftClickSelectInteraction.setActive(canUsePolygonBrush || canUsePolygonTools);
        }
    },
    watch: {
        interactionMode(mode) {
            this.toggleShiftClickSelectInteraction(mode);
            this.toggleCurrentInteraction(mode);

        },
    },
    mounted() {
        shiftClickSelectInteraction = new SelectInteraction({
            condition(e) {
                return click(e) && shiftKeyOnly(e);
            },
            style: Styles.highlight,
            layers: [this.annotationLayer],
            features: this.selectInteraction.getFeatures(),
            multi: true,
        });
        shiftClickSelectInteraction.on('select', this.handleFeatureSelect);
        shiftClickSelectInteraction.setActive(false);
        Keyboard.on('r', this.togglePolygonEraser, 0, this.listenerSet);
        Keyboard.on('t', this.togglePolygonFill, 0, this.listenerSet);
        Keyboard.on('e', this.togglePolygonBrush, 0, this.listenerSet);
    },
};
</script>
