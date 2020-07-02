<script>
import DismissImageGrid from '../components/dismissImageGrid';
import RelabelImageGrid from '../components/relabelImageGrid';
import {Events} from '../import';
import {handleErrorResponse} from '../import';
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
            labelTrees: [],
            step: 0,
            selectedLabel: null,
            annotationsCache: {},
            lastSelectedImage: null,
            forceChange: false,
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
            return this.allAnnotations.filter(function (item) {
                return item.dismissed;
            });
        },
        annotationsWithNewLabel() {
            return this.dismissedAnnotations.filter(function (item) {
                return !!item.newLabel;
            });
        },
        hasDismissedAnnotations() {
            return this.dismissedAnnotations.length > 0;
        },
        dismissedToSave() {
            let annotations = this.dismissedAnnotations;
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
        changedToSave() {
            let annotations = this.annotationsWithNewLabel;
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
        toDeleteCount() {
            return this.dismissedAnnotations.length - this.annotationsWithNewLabel.length;
        },
        saveButtonClass() {
            return this.forceChange ? 'btn-danger' : 'btn-success';
        },
    },
    methods: {
        getAnnotations(label) {
            if (!this.annotationsCache.hasOwnProperty(label.id)) {
                // Load only once
                Vue.set(this.annotationsCache, label.id, []);
                this.startLoading();
                this.queryAnnotations(label)
                    .then((response) => this.gotAnnotations(label, response.data), handleErrorResponse)
                    .finally(this.finishLoading);
            }
        },
        gotAnnotations(label, annotations) {
            // This is the object that we will use to store information for each
            // annotation patch.
            annotations = Object.keys(annotations)
                .map(function (id) {
                    return {
                        id: id,
                        uuid: annotations[id],
                        label_id: label.id,
                        dismissed: false,
                        newLabel: null,
                    };
                })
                // Show the newest annotations (with highest ID) first.
                .sort(function (a, b) {
                    return b.id - a.id;
                });

            Vue.set(this.annotationsCache, label.id, annotations);
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
            if (this.loading || (this.toDeleteCount > 0 && !confirm(`This might delete ${this.toDeleteCount} annotation(s). Continue?`))) {
                return;
            }

            this.startLoading();
            this.performSave({
                    dismissed: this.dismissedToSave,
                    changed: this.changedToSave,
                    force: this.forceChange,
                })
                .then(this.saved, handleErrorResponse)
                .finally(this.finishLoading);
        },
        saved() {
            Messages.success('Saved. You can now start a new re-evaluation session.');
            this.step = 0;
            for (let key in this.annotationsCache) {
                if (!this.annotationsCache.hasOwnProperty(key)) continue;
                delete this.annotationsCache[key];
            }
            this.handleSelectedLabel(this.selectedLabel);
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
    },
    created() {
        window.addEventListener('beforeunload', (e) => {
            if (this.hasDismissedAnnotations) {
                e.preventDefault();
                e.returnValue = '';

                return 'This page is asking you to confirm that you want to leave - data you have entered may not be saved.';
            }
        });
    },
};
</script>
