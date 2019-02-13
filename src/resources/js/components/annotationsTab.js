biigle.$component('videos.components.annotationsTab', {
    template:
    '<div class="annotations-tab">' +
        '<form' +
            ' v-if="hasFilters"' +
            ' class="annotations-tab__filter form-inline"' +
            ' @submit.prevent="applySelectedFilter"' +
            '>' +
                '<select' +
                    ' class="form-control"' +
                    ' v-model="selectedFilterIndex"' +
                    '>' +
                        '<option' +
                            ' v-for="(filter, index) in annotationFilters"' +
                            ' :value="index"' +
                            ' v-text="filter.name"' +
                            '></option>' +
                '</select>' +
                ' ' +
                '<span'+
                    ' v-show="selectedFilter"' +
                    ' ref="filterElement"' +
                    '></span>' +
                '<input' +
                    ' v-show="!selectedFilter"' +
                    ' class="form-control"' +
                    ' placeholder="Filter annotations"' +
                    ' type="text"' +
                    ' disabled="true"' +
                    '></input>' +
                ' ' +
                '<button' +
                    ' class="btn btn-default"' +
                    ' title="Clear annotation filter"' +
                    ' :class="clearButtonClass"' +
                    ' :disabled="!hasActiveFilter"' +
                    ' @click.prevent="emitUnselectFilter"' +
                    '>' +
                        '<i class="fa fa-times"></i>' +
                '</button>' +
        '</form>' +
        '<ul class="annotations-tab__list list-unstyled" ref="scrollList">' +
            '<label-item' +
                ' v-for="item in labelItems"' +
                ' :key="item.id"' +
                ' :label="item.label"' +
                ' :annotations="item.annotations"' +
                ' :can-detach-others="canDetachOthers"' +
                ' :own-user-id="ownUserId"' +
                ' @select="handleSelect"' +
                ' @detach="emitDetach"' +
                ' ></label-item>' +
        '</ul>' +
    '</div>',
    components: {
        labelItem: biigle.$require('videos.components.annotationsTabLabelItem'),
    },
    props: {
        hasActiveFilter: {
            type: Boolean,
            default: false,
        },
        annotations: {
            type: Array,
            default: [],
        },
        annotationFilters: {
            type: Array,
            default: [],
        },
        canDetachOthers: {
            type: Boolean,
            default: false,
        },
        ownUserId: {
            type: Number,
            default: null,
        },
    },
    data: function () {
        return {
            selectedFilterIndex: null,
        };
    },
    computed: {
        labelItems: function () {
            var labels = {};
            var annotations = {};

            this.annotations.forEach(function (annotation) {
                annotation.labels.forEach(function (annotationLabel) {
                    if (!labels.hasOwnProperty(annotationLabel.label.id)) {
                        labels[annotationLabel.label.id] = annotationLabel.label;
                        annotations[annotationLabel.label.id] = [];
                    }

                    annotations[annotationLabel.label.id].push(annotation);
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
        hasFilters: function () {
            return this.annotationFilters.length > 0;
        },
        selectedFilter: function () {
            return this.annotationFilters[this.selectedFilterIndex];
        },
        clearButtonClass: function () {
            return {
                'btn-info': this.hasActiveFilter,
            };
        },
    },
    methods: {
        handleSelect: function (annotation, shift) {
            if (annotation.isSelected && shift) {
                this.$emit('deselect', annotation);
            } else {
                this.$emit('select', annotation, annotation.startFrame, shift);
            }
        },
        emitDetach: function (annotation, annotationLabel) {
            this.$emit('detach', annotation, annotationLabel);
        },
        emitSelectFilter: function (filter) {
            this.$emit('select-filter', filter);
        },
        emitUnselectFilter: function () {
            this.$emit('unselect-filter');
        },
    },
    watch: {
        selectedFilter: function (filter, oldFilter) {
            if (oldFilter) {
                this.$refs.filterElement.removeChild(oldFilter.$el);
                oldFilter.$off('select', this.emitSelectFilter);
            }

            this.$refs.filterElement.appendChild(filter.$el);
            filter.$on('select', this.emitSelectFilter);
        },
    },
});
