biigle.$component('annotations.components.annotationsTabAnnotationItem', {
    template:
    '<li' +
        ' class="annotations-tab-item__sub-item"' +
        ' :class="classObject"' +
        // This is required for the 'scroll into view' feature of the annotation tab.
        ' :data-annotation-id="annotation.id"' +
        ' @click="emitSelect"' +
        ' @dblclick="emitFocus"' +
        '>' +
            '<button' +
                ' v-if="canDetach"' +
                ' type="button"' +
                ' title="Detach this label from the annotation"' +
                ' class="close"' +
                ' @click.stop="emitDetach"' +
                '>' +
                    '<span aria-hidden="true">&times;</span>' +
            '</button>' +
            '<span' +
                ' class="icon"' +
                ' :class="shapeClass"' +
                '></span>' +
            '<span v-text="username"></span>' +
        '</li>' +
    '</li>',
    props: {
        annotation: {
            type: Object,
            required: true,
        },
        annotationLabel: {
            type: Object,
            required: true,
        },
        canDetach: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        classObject: function () {
            return {
                selected: this.annotation.selected !== false,
            };
        },
        shapeClass: function () {
            return 'icon-' + this.annotation.shape.toLowerCase();
        },
        username: function () {
            if (this.annotationLabel.user) {
                return this.annotationLabel.user.firstname + ' ' + this.annotationLabel.user.lastname;
            }

            return '(user deleted)';
        },
    },
    methods: {
        emitSelect: function (e) {
            this.$emit('select', this.annotation, e.shiftKey);
        },
        emitDetach: function () {
            this.$emit('detach', this.annotation, this.annotationLabel);
        },
        emitFocus: function () {
            this.$emit('focus', this.annotation);
        },
    },
});
