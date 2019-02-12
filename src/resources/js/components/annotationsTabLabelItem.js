biigle.$component('videos.components.annotationsTabLabelItem', {
    template:
    '<li' +
        ' class="annotations-tab-item"' +
        ' :class="classObject"' +
        ' :title="title"' +
        '>' +
            '<div' +
                ' class="annotations-tab-item__title"' +
                ' @click="toggleOpen"' +
                '>' +
                    '<span' +
                        ' class="pull-right badge"' +
                        ' v-text="count"' +
                        ' :title="countTitle"' +
                        '></span>' +
                    '<span' +
                        ' class="annotations-tab-item__color"' +
                        ' :style="colorStyle"' +
                        '></span>' +
                    '<span v-text="label.name"></span>' +
            '</div>' +
            '<ul class="annotations-tab-item__list list-unstyled" v-show="isSelected">' +
                '<annotation-item' +
                    ' v-for="item in annotationItems"' +
                    ' :annotation="item.annotation"' +
                    ' :annotation-label="item.annotationLabel"' +
                    ' :can-detach="item.canDetach"' +
                    ' @select="emitSelect"' +
                    ' @detach="emitDetach"' +
                    '></annotation-item>' +
            '</ul>' +
    '</li>',
    components: {
        annotationItem: biigle.$require('videos.components.annotationsTabAnnotationItem'),
    },
    props: {
        label: {
            type: Object,
            default: [],
        },
        annotations: {
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
            open: false,
        };
    },
    computed: {
        title: function () {
            return 'Annotations with label ' + this.label.name;
        },
        classObject: function () {
            return {
                selected: this.isSelected,
            };
        },
        count: function () {
            return this.annotations.length;
        },
        countTitle: function () {
            return 'There are ' + this.count + ' annotations with label ' + this.label.name;
        },
        colorStyle: function () {
            return 'background-color: #' + this.label.color;
        },
        isSelected: function () {
            return this.open || this.annotations.reduce(function (carry, annotation) {
                return carry || annotation.isSelected;
            }, false);
        },
        annotationItems: function () {
            var items = [];
            this.annotations.forEach(function (annotation) {
                annotation.labels.forEach(function (annotationLabel) {
                    if (annotationLabel.label_id === this.label.id) {
                        items.push({
                            annotation: annotation,
                            annotationLabel: annotationLabel,
                            canDetach: this.canDetachAnnotationLabel(annotationLabel),
                        });
                    }
                }, this);
            }, this);

            return items;
        },
    },
    methods: {
        toggleOpen: function () {
            this.open = !this.open;
        },
        emitSelect: function (annotation, shift) {
            this.$emit('select', annotation, shift);
        },
        emitDetach: function (annotation, annotationLabel) {
            this.$emit('detach', annotation, annotationLabel);
        },
        canDetachAnnotationLabel: function (annotationLabel) {
            return this.canDetachOthers || this.ownUserId === annotationLabel.user_id;
        },
    },
    watch: {
        //
    },
    created: function () {
        //
    },
});
