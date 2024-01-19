<script>
import DismissImageGrid from '../components/dismissImageGrid';
import RelabelImageGrid from '../components/relabelImageGrid';
import {Echo} from '../import';
import {Events} from '../import';
import {handleErrorResponse} from '../import';
import {IMAGE_ANNOTATION, VIDEO_ANNOTATION} from '../constants';
import {LabelTrees} from '../import';
import {LoaderMixin} from '../import';
import {Messages} from '../import';
import {PowerToggle} from '../import';
import {SidebarTab} from '../import';
import {Sidebar} from '../import';

/**
 * Mixin for largo view models
 */
export default {
    mixins: [LoaderMixin],
    components: {
        labelTrees: LabelTrees,
        sidebar: Sidebar,
        sidebarTab: SidebarTab,
        powerToggle: PowerToggle,
        dismissImageGrid: DismissImageGrid,
        relabelImageGrid: RelabelImageGrid,
    },
    data() {
        return {
            user: null,
            labelTrees: [],
            step: 0,
            selectedLabel: null,
            annotationsCache: {},
            lastSelectedImage: null,
            forceChange: false,
            waitForSessionId: null,
            showAnnotationOutlines: true,
        };
    },
    computed: {
        isInDismissStep() {
            return this.step === 0;
        },
        isInRelabelStep() {
            return this.step === 1;
        },
        annotations() {
            if (this.selectedLabel && this.annotationsCache.hasOwnProperty(this.selectedLabel.id)) {
                return this.annotationsCache[this.selectedLabel.id];
            }

            return [];
        },
        allAnnotations() {
            let annotations = [];
            for (let id in this.annotationsCache) {
                if (!this.annotationsCache.hasOwnProperty(id)) continue;
                Array.prototype.push.apply(annotations, this.annotationsCache[id]);
            }

            return annotations;
        },
        hasNoAnnotations() {
            return this.selectedLabel && !this.loading && this.annotations.length === 0;
        },
        dismissedAnnotations() {
            return this.allAnnotations.filter(item => item.dismissed);
        },
        annotationsWithNewLabel() {
            return this.dismissedAnnotations.filter(item => !!item.newLabel);
        },
        hasDismissedAnnotations() {
            return this.dismissedAnnotations.length > 0;
        },
        dismissedImageAnnotationsToSave() {
            return this.packDismissedToSave(
                this.dismissedAnnotations.filter(a => a.type === IMAGE_ANNOTATION)
            );
        },
        dismissedVideoAnnotationsToSave() {
            return this.packDismissedToSave(
                this.dismissedAnnotations.filter(a => a.type === VIDEO_ANNOTATION)
            );
        },
        changedImageAnnotationsToSave() {
            return this.packChangedToSave(
                this.annotationsWithNewLabel.filter(a => a.type === IMAGE_ANNOTATION)
            );
        },
        changedVideoAnnotationsToSave() {
            return this.packChangedToSave(
                this.annotationsWithNewLabel.filter(a => a.type === VIDEO_ANNOTATION)
            );
        },
        toDeleteCount() {
            return this.dismissedAnnotations.length - this.annotationsWithNewLabel.length;
        },
        saveButtonClass() {
            return this.forceChange ? 'btn-danger' : 'btn-success';
        },
        annotationOutlines(){
            return this.showAnnotationOutlines;
        },
        disableShowingOutlines(){
            return this.loading || !this.selectedLabel;
        }
    },
    methods: {
        getAnnotations(label) {
            if (!this.annotationsCache.hasOwnProperty(label.id)) {
                // Load only once
                Vue.set(this.annotationsCache, label.id, []);
                this.startLoading();
                this.queryAnnotations(label)
                    .then((response) => this.gotAnnotations(label, response), handleErrorResponse)
                    .finally(this.finishLoading);
            }
        },
        gotAnnotations(label, response) {
            let imageAnnotations = response[0].data;
            let videoAnnotations = response[1].data;

            // This is the object that we will use to store information for each
            // annotation patch.
            let annotations = [];

            if (imageAnnotations) {
                annotations = annotations.concat(this.initAnnotations(label, imageAnnotations, IMAGE_ANNOTATION));
            }

            if (videoAnnotations) {
                annotations = annotations.concat(this.initAnnotations(label, videoAnnotations, VIDEO_ANNOTATION));
            }
            // Show the newest annotations (with highest ID) first.
            annotations = annotations.sort((a, b) => b.id - a.id);

            Vue.set(this.annotationsCache, label.id, annotations);
        },
        initAnnotations(label, annotations, type) {
            return Object.keys(annotations)
                .map(function (id) {
                    return {
                        id: id,
                        uuid: annotations[id],
                        label_id: label.id,
                        dismissed: false,
                        newLabel: null,
                        type: type,
                        label_color: label.color,
                    };
                });
        },
        handleSelectedLabel(label) {
            this.selectedLabel = label;

            if (this.isInDismissStep) {
                this.getAnnotations(label);
            }
        },
        handleDeselectedLabel() {
            this.selectedLabel = null;
        },
        handleSelectedImageDismiss(image, event) {
            if (image.dismissed) {
                image.dismissed = false;
                image.newLabel = null;
            } else {
                image.dismissed = true;
                if (event.shiftKey && this.lastSelectedImage) {
                    this.dismissAllImagesBetween(image, this.lastSelectedImage);
                } else {
                    this.lastSelectedImage = image;
                }
            }
        },
        goToRelabel() {
            this.step = 1;
            this.lastSelectedImage = null;
        },
        goToDismiss() {
            this.step = 0;
            this.lastSelectedImage = null;
            if (this.selectedLabel) {
                this.getAnnotations(this.selectedLabel);
            }
        },
        handleSelectedImageRelabel(image, event) {
            if (image.newLabel) {
                // If a new label is selected, swap the label instead of removing it.
                if (this.selectedLabel && image.newLabel.id !== this.selectedLabel.id) {
                    image.newLabel = this.selectedLabel;
                } else {
                    image.newLabel = null;
                }
            } else if (this.selectedLabel) {
                image.newLabel = this.selectedLabel;
                if (event.shiftKey && this.lastSelectedImage) {
                    this.relabelAllImagesBetween(image, this.lastSelectedImage);
                } else {
                    this.lastSelectedImage = image;
                }
            }
        },
        save() {
            if (this.loading) {
                return
            }

            if (this.toDeleteCount > 0) {
                let response;
                while (response !== null && parseInt(response, 10) !== this.toDeleteCount) {
                    response = prompt(`This might delete ${this.toDeleteCount} annotation(s). Please enter the number to continue.`);
                }

                if (response === null) {
                    return;
                }
            }

            this.startLoading();
            this.performSave({
                    dismissed_image_annotations: this.dismissedImageAnnotationsToSave,
                    changed_image_annotations: this.changedImageAnnotationsToSave,
                    dismissed_video_annotations: this.dismissedVideoAnnotationsToSave,
                    changed_video_annotations: this.changedVideoAnnotationsToSave,
                    force: this.forceChange,
                })
                .then(
                    response => this.waitForSessionId = response.body.id,
                    (response) => {
                        this.finishLoading();
                        handleErrorResponse(response);
                    }
                );
        },
        handleSessionSaved(event) {
            if (event.id == this.waitForSessionId) {
                this.finishLoading();
                Messages.success('Saved. You can now start a new re-evaluation session.');
                this.step = 0;
                for (let key in this.annotationsCache) {
                    if (!this.annotationsCache.hasOwnProperty(key)) continue;
                    delete this.annotationsCache[key];
                }
                this.handleSelectedLabel(this.selectedLabel);
            }
        },
        handleSessionFailed(event) {
            if (event.id == this.waitForSessionId) {
                this.finishLoading();
                Messages.danger('There was an unexpected error.');
            }
        },
        performOnAllImagesBetween(image1, image2, callback) {
            let index1 = this.allAnnotations.indexOf(image1);
            let index2 = this.allAnnotations.indexOf(image2);
            if (index2 < index1) {
                let tmp = index2;
                index2 = index1;
                index1 = tmp;
            }

            for (let i = index1 + 1; i < index2; i++) {
                callback(this.allAnnotations[i]);
            }

        },
        dismissAllImagesBetween(image1, image2) {
            this.performOnAllImagesBetween(image1, image2, function (image) {
                image.dismissed = true;
            });
        },
        relabelAllImagesBetween(image1, image2) {
            let label = this.selectedLabel;
            this.performOnAllImagesBetween(image1, image2, function (image) {
                if (image.dismissed) {
                    image.newLabel = label;
                }
            });
        },
        enableForceChange() {
            this.forceChange = true;
        },
        disableForceChange() {
            this.forceChange = false;
        },
        packDismissedToSave(annotations) {
            let dismissed = {};

            for (let i = annotations.length - 1; i >= 0; i--) {
                if (dismissed.hasOwnProperty(annotations[i].label_id)) {
                    dismissed[annotations[i].label_id].push(annotations[i].id);
                } else {
                    dismissed[annotations[i].label_id] = [annotations[i].id];
                }
            }

            return dismissed;
        },
        packChangedToSave(annotations) {
            let changed = {};

            for (let i = annotations.length - 1; i >= 0; i--) {
                if (changed.hasOwnProperty(annotations[i].newLabel.id)) {
                    changed[annotations[i].newLabel.id].push(annotations[i].id);
                } else {
                    changed[annotations[i].newLabel.id] = [annotations[i].id];
                }
            }

            return changed;
        },
        initializeEcho() {
            Echo.getInstance().private(`user-${this.user.id}`)
                .listen('.Biigle\\Modules\\Largo\\Events\\LargoSessionSaved', this.handleSessionSaved)
                .listen('.Biigle\\Modules\\Largo\\Events\\LargoSessionFailed', this.handleSessionFailed);
        },
        showingOutlines(show){
            this.showAnnotationOutlines = show;
        },
        emitShowOutlines(show){
            Events.$emit('show-annotation-outlines', show);
        }
    },
    watch: {
        annotations(annotations) {
            Events.$emit('annotations-count', annotations.length);
        },
        dismissedAnnotations(annotations) {
            Events.$emit('dismissed-annotations-count', annotations.length);
        },
        step(step) {
            Events.$emit('step', step);
        },
        selectedLabel() {
            if (this.isInDismissStep) {
                this.$refs.dismissGrid.setOffset(0);
            }
        },
        showAnnotationOutlines(show){
            this.emitShowOutlines(show)
        }
    },
    created() {
        this.user = biigle.$require('largo.user');

        window.addEventListener('beforeunload', (e) => {
            if (this.hasDismissedAnnotations) {
                e.preventDefault();
                e.returnValue = '';

                return 'This page is asking you to confirm that you want to leave - data you have entered may not be saved.';
            }
        });

        this.initializeEcho();

        Events.$on('dismiss-image-grid-image-mounted',() => this.emitShowOutlines(this.showAnnotationOutlines));
    },
};
</script>
