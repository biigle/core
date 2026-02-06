<script>
import AttachLabelInteraction from '@/annotations/ol/AttachLabelInteraction.js';
import ModifyInteraction from '@biigle/ol/interaction/Modify';
import TranslateInteraction from '@/annotations/ol/TranslateInteraction.js';
import {shiftKeyOnly as shiftKeyOnlyCondition} from '@biigle/ol/events/condition';
import {singleClick as singleClickCondition} from '@biigle/ol/events/condition';
import {simplifyPolygon} from '@/annotations/ol/PolygonValidator.js';
import {isInvalidShape} from '@/annotations/utils.js';

const allowedSplitShapes = ['Point', 'Circle', 'Rectangle', 'WholeFrame'];

/**
 * Mixin for the videoScreen component that contains logic for the edit/delete
 * interactions.
 *
 * @type {Object}
 */
export default {
    emits: [
        'attach-label',
        'attaching-active',
        'delete',
        'is-invalid-shape',
        'link-annotations',
        'modify',
        'split-annotation',
        'swap-label',
        'swapping-active',
        'force-swap-label',
        'force-swapping-active',
    ],
    data() {
        return {
            // This is no interaction mode because we want the select interaction
            // to be active too. The select interaction is only enabled in default
            // interaction mode.
            isTranslating: false,
        };
    },
    computed: {
        cannotSplitAnnotation() {
            return this.selectedAnnotations.length !== 1 ||
                this.selectedAnnotations[0].frames.length <= 1 ||
                allowedSplitShapes.indexOf(this.selectedAnnotations[0].shape) === -1;
        },
        cannotLinkAnnotations() {
            return this.selectedAnnotations.length !== 2
                || this.selectedAnnotations[0].shape_id !== this.selectedAnnotations[1].shape_id
                || this.selectedAnnotations[0].labels.length !== this.selectedAnnotations[1].labels.length
                || !this.labelsAreIdentical(this.selectedAnnotations[0], this.selectedAnnotations[1]);
        },
        isAttaching() {
            return this.interactionMode === 'attachLabel';
        },
        isSwapping() {
            return this.interactionMode === 'swapLabel';
        },
        isForceSwapping() {
            return this.interactionMode === 'forceSwapLabel';
        },
        isAnySwapping() {
            return this.isSwapping || this.isForceSwapping;
        },
    },
    methods: {
        labelsAreIdentical(a, b) {
            let labelIdsA = a.labels.map(l => l.label_id);
            let labelIdsB = b.labels.map(l => l.label_id);

            return labelIdsA.every(id => labelIdsB.includes(id));
        },
        initModifyInteraction(map) {
            // Map to detect which features were changed between modifystart and
            // modifyend events of the modify interaction.
            this.featureRevisionMap = {};
            this.modifyInteraction = new ModifyInteraction({
                features: this.selectInteraction.getFeatures(),
                // The Shift key must be pressed to delete vertices, so that new
                // vertices can be drawn at the same position of existing
                // vertices.
                deleteCondition: function (event) {
                    return shiftKeyOnlyCondition(event) && singleClickCondition(event);
                },
            });

            this.modifyInteraction.on('modifystart', this.handleModifyStart);
            this.modifyInteraction.on('modifyend', this.handleModifyEnd);

            map.addInteraction(this.modifyInteraction);
        },
        handleModifyStart(e) {
            e.features.getArray().forEach((feature) => {
                this.featureRevisionMap[feature.getId()] = feature.getRevision();
            });
        },
        handleModifyEnd(e) {
            let payload = e.features.getArray()
                .filter((feature) => {
                    return this.featureRevisionMap[feature.getId()] !== feature.getRevision();
                })
                .map((feature) => {
                    if (isInvalidShape(feature)) {
                        this.$emit('is-invalid-shape', feature.getGeometry().getType());
                        return;
                    }
                    // Check polygons
                    if (feature.getGeometry().getType() === 'Polygon') {
                        // If polygon is self-intersecting, create simple polygon
                        simplifyPolygon(feature);
                    }
                    return {
                        annotation: feature.get('annotation'),
                        points: this.getPointsFromGeometry(feature.getGeometry()),
                        time: this.video.currentTime,
                    };
                });

            if (payload.length > 0) {
                this.$emit('modify', payload);
            }
        },
        maybeUpdateModifyInteractionMode(isDefault) {
            if (this.modifyInteraction) {
                this.modifyInteraction.setActive(isDefault);
            }
        },
        emitDelete() {
            if (this.canDelete && this.selectedAnnotations.length > 0 && confirm('Are you sure that you want to delete all selected annotations/keyframes?')) {
                this.$emit('delete', this.selectedAnnotations);
            }
        },
        toggleTranslating() {
            this.resetInteractionMode();
            this.isTranslating = !this.isTranslating;
        },
        initTranslateInteraction(map) {
            this.translateInteraction = new TranslateInteraction({
                features: this.selectedFeatures,
                map: map,
            });
            this.translateInteraction.setActive(false);
            this.translateInteraction.on('translatestart', this.handleModifyStart);
            this.translateInteraction.on('translateend', this.handleModifyEnd);
            this.map.addInteraction(this.translateInteraction);
        },
        maybeUpdateIsTranslating(isDefault) {
            if (this.translateInteraction && !isDefault) {
                this.isTranslating = false;
            }
        },
        resetTranslating() {
            this.isTranslating = false;
        },
        emitSplitAnnotation() {
            this.$emit('split-annotation', this.selectedAnnotations[0], this.video.currentTime);
        },
        emitLinkAnnotations() {
            this.$emit('link-annotations', this.selectedAnnotations);
        },
        toggleAttaching() {
            if (this.isAttaching) {
                this.resetInteractionMode();
            } else {
                this.interactionMode = 'attachLabel';
            }
        },
        toggleSwapping() {
            if (this.isSwapping) {
                this.resetInteractionMode();
            } else {
                this.interactionMode = 'swapLabel';
            }
        },
        toggleForceSwapping() {
            if (this.isForceSwapping) {
                this.resetInteractionMode();
            } else {
                this.interactionMode = 'forceSwapLabel';
            }
        },
        initAttachInteraction(map) {
            this.attachInteraction = new AttachLabelInteraction({
                features: this.annotationFeatures,
                map: map,
            });
            this.attachInteraction.setActive(false);
            this.attachInteraction.on('attach', this.handleAttachLabel);
            this.map.addInteraction(this.attachInteraction);
        },
        initSwapInteraction(map) {
            this.swapInteraction = new AttachLabelInteraction({
                features: this.annotationFeatures,
                map: map,
            });
            this.swapInteraction.setActive(false);
            this.swapInteraction.on('attach', this.handleSwapLabel);
            this.map.addInteraction(this.swapInteraction);
        },
        handleAttachLabel(e) {
            this.$emit('attach-label', e.feature.get('annotation'));
        },
        handleSwapLabel(e) {
            if (this.isSwapping) {
                this.$emit('swap-label', e.feature.get('annotation'));
            } else if (this.isForceSwapping) {
                this.$emit('force-swap-label', e.feature.get('annotation'));
            }
        },
        maybeResetAttaching(hasNoLabel) {
            if (this.isAttaching && hasNoLabel) {
                this.resetInteractionMode();
            }
        },
        maybeResetSwapping(hasNoLabel) {
            if (this.isSwapping && hasNoLabel) {
                this.resetInteractionMode();
            }
        },
        maybeResetForceSwapping(hasNoLabel) {
            if (this.isForceSwapping && hasNoLabel) {
                this.resetInteractionMode();
            }
        },
    },
    watch: {
        isTranslating(translating) {
            if (this.translateInteraction) {
                this.translateInteraction.setActive(translating);
                if (translating) {
                    this.modifyInteraction.setActive(false);
                } else if (this.isDefaultInteractionMode) {
                    this.modifyInteraction.setActive(true);
                }
            }
        },
        isAttaching(attaching) {
            if (this.attachInteraction) {
                this.attachInteraction.setActive(attaching);
            }

            this.$emit('attaching-active', attaching);
        },
        isAnySwapping(swapping) {
            if (this.swapInteraction) {
                this.swapInteraction.setActive(swapping);
            }
        },
        isSwapping(swapping) {
            this.$emit('swapping-active', swapping);
        },
        isForceSwapping(swapping) {
            this.$emit('force-swapping-active', swapping);
        },
    },
    created() {
        if (this.canModify) {
            this.$watch('mapReadyRevision', {
                once: true,
                handler() {
                    // Add the event listener after initLayersAndInteractions of
                    // videoScreen so the select interaction is created before the
                    // modify interaction.
                    this.initModifyInteraction(this.map);
                    this.initTranslateInteraction(this.map);
                    this.initAttachInteraction(this.map);
                    this.initSwapInteraction(this.map);
                },
            });

            this.$watch('isDefaultInteractionMode', this.maybeUpdateModifyInteractionMode);
            this.$watch('isDefaultInteractionMode', this.maybeUpdateIsTranslating);
            this.$watch('hasNoSelectedLabel', this.maybeResetAttaching);
            this.$watch('hasNoSelectedLabel', this.maybeResetSwapping);
            this.$watch('hasNoSelectedLabel', this.maybeResetForceSwapping);
            this.keyboardOn('m', this.toggleTranslating, 0, this.listenerSet);
            this.keyboardOn('Escape', this.resetTranslating, 0, this.listenerSet);
            this.keyboardOn('l', this.toggleAttaching, 0, this.listenerSet);
            this.keyboardOn('Shift+l', this.toggleSwapping, 0, this.listenerSet);
            this.keyboardOn('Delete', this.emitDelete, 0, this.listenerSet);
        }
    },
};
</script>
