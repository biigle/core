/**
 * The annotations tab of the annotator
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationsTab', {
    components: {
        labelItem: biigle.$require('annotations.components.annotationsTabItem'),
        annotationsFilter: biigle.$require('annotations.components.annotationsFilter'),
    },
    props: {
        annotations: {
            type: Array,
            required: true,
        },
        filteredAnnotations: {
            type: Array,
            required: true,
        },
    },
    computed: {
        // Compiles a list of all labels and their associated annotations.
        items: function () {
            var labels = [];
            var annotations = {};
            this.filteredAnnotations.forEach(function (annotation) {
                annotation.labels.forEach(function (annotationLabel) {
                    var item = {
                        annotation: annotation,
                        annotationLabel: annotationLabel,
                    };

                    if (annotations.hasOwnProperty(annotationLabel.label.id)) {
                        annotations[annotationLabel.label.id].push(item);
                    } else {
                        annotations[annotationLabel.label.id] = [item];
                        labels.push(annotationLabel.label);
                    }
                });
            });

            // Sort labels alphabetically in the sidebar.
            return labels.sort(this.sortByName)
                .map(function (label) {
                    return {
                        label: label,
                        annotations: annotations[label.id]
                    };
                });
        },
    },
    methods: {
        sortByName: function (a, b) {
            return a.name > b.name ? 1 : -1;
        },
        reallyScrollIntoView: function (annotations) {
            var scrollElement = this.$refs.scrollList;
            var scrollTop = scrollElement.scrollTop;
            var height = scrollElement.offsetHeight;
            var top = Infinity;
            var bottom = 0;

            var element;
            annotations.forEach(function (annotation) {
                var elements = scrollElement.querySelectorAll(
                    '[data-annotation-id="' + annotation.id + '"]'
                );
                for (var i = elements.length - 1; i >= 0; i--) {
                    element = elements[i];
                    top = Math.min(element.offsetTop, top);
                    bottom = Math.max(element.offsetTop + element.offsetHeight, bottom);
                }
            }, this);

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
        // If an annotation is selected on the map the respective annotation labels
        // should be visible in the annotations tab, too. This function adjusts the
        // scrollTop of the list so all selected annotation labels are visible (if
        // possible).
        scrollIntoView: function (annotations) {
            if (annotations.length === 0) {
                return;
            }

            // Wait for the annotations list to be rendered so the offsetTop of each
            // item can be determined.
            this.$nextTick(function () {
                this.reallyScrollIntoView(annotations);
            });
        },
        // If an annotation label is selected it may be that a preceding annotation item
        // expands which would push the currently selected annotation label down. This
        // function adjusts the scrollTop so the selected annotation label stays at the
        // same position relative to the cursor.
        keepElementPosition: function (element) {
            var scrollElement = this.$refs.scrollList;
            var positionBefore = element.offsetTop - scrollElement.scrollTop;
            // Wait until everything is rendered.
            this.$nextTick(function () {
                this.$nextTick(function () {
                    var positionAfter = element.offsetTop - scrollElement.scrollTop;
                    // Scroll so the element has the same relative position than before.
                    scrollElement.scrollTop += positionAfter - positionBefore;
                });
            });
        },
        bubbleFilter: function (filter) {
            this.$emit('filter', filter);
        },
    },
});
