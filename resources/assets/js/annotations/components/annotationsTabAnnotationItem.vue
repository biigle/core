<template>
    <li
        class="annotations-tab-item__sub-item"
        :class="classObject"
        :data-annotation-id="annotation.id"
        @click="emitSelect"
        @dblclick="emitFocus"
        >
            <button
                v-if="canDetach"
                type="button"
                title="Detach this label from the annotation"
                class="close"
                @click.stop="emitDetach"
                >
                    <span aria-hidden="true">&times;</span>
            </button>
            <span
                class="icon"
                :class="shapeClass"
                ></span>
            <span v-text="username"></span>
    </li>
</template>

<script>
export default {
    emits: [
        'detach',
        'focus',
        'select',
    ],
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
        classObject() {
            return {
                selected: this.annotation.selected !== false,
            };
        },
        shapeClass() {
            return 'icon-' + this.annotation.shape.toLowerCase();
        },
        username() {
            if (this.annotationLabel.user) {
                return this.annotationLabel.user.firstname + ' ' + this.annotationLabel.user.lastname;
            }

            return '(user deleted)';
        },
    },
    methods: {
        emitSelect(e) {
            this.$emit('select', this.annotation, e.shiftKey);
        },
        emitDetach() {
            this.$emit('detach', this.annotation, this.annotationLabel);
        },
        emitFocus() {
            this.$emit('focus', this.annotation);
        },
    },
};
</script>

