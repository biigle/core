<template>
    <li
        class="annotations-tab-item"
        :class="classObject"
        :title="title"
        >
            <div
                class="annotations-tab-item__title"
                @click="toggleOpen"
                >
                    <span
                        class="pull-right badge"
                        v-text="count"
                        :title="countTitle"
                        ></span>
                    <span
                        class="annotations-tab-item__color"
                        :style="colorStyle"
                        ></span>
                    <span v-text="label.name"></span>
            </div>
            <ul class="annotations-tab-item__list list-unstyled" v-show="isSelected">
                <annotation-item
                    v-for="item in annotationItems"
                    :key="item.annotationLabel.id"
                    :annotation="item.annotation"
                    :annotation-label="item.annotationLabel"
                    :can-detach="item.canDetach"
                    @select="emitSelect"
                    @detach="emitDetach"
                    @focus="emitFocus"
                    ></annotation-item>
            </ul>
    </li>
</template>

<script>
import AnnotationItem from './annotationsTabAnnotationItem.vue';

export default {
    emits: [
        'detach',
        'focus',
        'select',
    ],
    components: {
        annotationItem: AnnotationItem,
    },
    props: {
        label: {
            type: Object,
            default() {
                return {};
            },
        },
        annotations: {
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
    },
    data() {
        return {
            open: false,
        };
    },
    computed: {
        title() {
            return `Annotations with label ${this.label.name}`;
        },
        classObject() {
            return {
                selected: this.isSelected,
            };
        },
        count() {
            return this.annotationItems.length;
        },
        countTitle() {
            return `There are ${this.count} annotations with label ${this.label.name}`;
        },
        colorStyle() {
            return 'background-color: #' + this.label.color;
        },
        isSelected() {
            return this.open || this.annotations.reduce(function (carry, annotation) {
                return carry || annotation.selected !== false;
            }, false);
        },
        annotationItems() {
            let items = [];
            this.annotations.forEach((annotation) => {
                annotation.labels.forEach((annotationLabel) => {
                    if (annotationLabel.label_id === this.label.id) {
                        items.push({
                            annotation: annotation,
                            annotationLabel: annotationLabel,
                            canDetach: this.canDetachAnnotationLabel(annotationLabel),
                        });
                    }
                });
            });

            return items;
        },
    },
    methods: {
        toggleOpen() {
            this.open = !this.open;
        },
        emitSelect(annotation, shift) {
            this.$emit('select', annotation, shift);
        },
        emitDetach(annotation, annotationLabel) {
            this.$emit('detach', annotation, annotationLabel);
        },
        emitFocus(annotation) {
            this.$emit('focus', annotation);
        },
        canDetachAnnotationLabel(annotationLabel) {
            return this.canDetachOthers || this.ownUserId === annotationLabel.user_id;
        },
    },
};
</script>
