<script>
import Filters from './annotationsTabFilters.vue';
import LabelItem from './annotationsTabLabelItem.vue';

export default {
    emits: [
        'deselect',
        'detach',
        'focus',
        'select',
        'select-filter',
        'unselect-filter',
    ],
    components: {
        filters: Filters,
        labelItem: LabelItem,
    },
    props: {
        hasActiveFilter: {
            type: Boolean,
            default: false,
        },
        annotations: {
            type: Array,
            default() {
                return [];
            },
        },
        annotationFilters: {
            type: Array,
            default() {
                return [];
            },
        },
        canDetachOthers: {
            type: Boolean,
            default: false,
        },
        ownUserId: {
            type: Number,
            default: null,
        },
        selectedAnnotations: {
            type: Array,
            default() {
                return [];
            },
        },
        annotationsHiddenByFilter: {
            type: Boolean,
            default: false,
        },
        totalAnnotationCount: {
            type: Number,
            default: 0
        }
    },
    computed: {
        labelItems() {
            let labels = {};
            let annotations = {};
            let uniqueMap = {};

            this.annotations.forEach(function (annotation) {
                annotation.labels.forEach(function (annotationLabel) {
                    if (!labels.hasOwnProperty(annotationLabel.label.id)) {
                        labels[annotationLabel.label_id] = annotationLabel.label;
                        annotations[annotationLabel.label_id] = [];
                    }

                    // Make sure each annotation is added only once for each label item.
                    // This is important if the annotation has the same label attached by
                    // multiple users.
                    let uniqueKey = annotation.id + '-' + annotationLabel.label_id;
                    if (!uniqueMap.hasOwnProperty(uniqueKey)) {
                        uniqueMap[uniqueKey] = null;
                        annotations[annotationLabel.label_id].push(annotation);
                    }
                });
            });

            return Object.values(labels)
                .sort(function (a, b) {
                    return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
                })
                .map(function (label) {
                    return {
                        id: label.id,
                        label: label,
                        annotations: annotations[label.id],
                    };
                });
        },
        annotationBadgeCount() {
            if (this.hasActiveFilter) {
                return this.annotations.length + "/" + this.totalAnnotationCount
            } else {
                return this.totalAnnotationCount;
            }
        },
    },
    methods: {
        handleSelect(annotation, shift) {
            if (annotation.selected !== false && shift) {
                this.$emit('deselect', annotation);
            } else {
                this.$emit('select', annotation, shift);
            }
        },
        emitDetach(annotation, annotationLabel) {
            this.$emit('detach', annotation, annotationLabel);
        },
        emitSelectFilter(filter) {
            this.$emit('select-filter', filter);
        },
        emitUnselectFilter() {
            this.$emit('unselect-filter');
        },
        emitFocus(annotation) {
            this.$emit('focus', annotation);
        },
        // If an annotation is selected on the map the respective annotation labels
        // should be visible in the annotations tab, too. This function adjusts the
        // scrollTop of the list so all selected annotation labels are visible (if
        // possible).
        scrollIntoView(annotations) {
            let scrollElement = this.$refs.scrollList;
            let scrollTop = scrollElement.scrollTop;
            let height = scrollElement.offsetHeight;
            let top = Infinity;
            let bottom = 0;

            let element;
            annotations.forEach(function (annotation) {
                let elements = scrollElement.querySelectorAll(
                    `[data-annotation-id="${annotation.id}"]`
                );
                for (let i = elements.length - 1; i >= 0; i--) {
                    element = elements[i];
                    top = Math.min(element.offsetTop, top);
                    bottom = Math.max(element.offsetTop + element.offsetHeight, bottom);
                }
            });

            // Scroll scrollElement so all list items of selected annotations are
            // visible or scroll to the first list item if all items don't fit inside
            // scrollElement.
            if (scrollTop > top) {
                scrollElement.scrollTop = top;
            } else if ((scrollTop + height) < bottom) {
                if (height >= (bottom - top)) {
                    scrollElement.scrollTop = bottom - scrollElement.offsetHeight;
                } else {
                    scrollElement.scrollTop = top;
                }
            }
        },
    },
    watch: {
        selectedAnnotations(annotations) {
            if (annotations.length > 0) {
                // Wait for the annotations list to be rendered so the offsetTop of each
                // item can be determined.
                this.$nextTick(function () {
                    this.scrollIntoView(annotations);
                });
            }
        },
    },
};
</script>
