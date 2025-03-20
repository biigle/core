<template>
    <tr class="label-tree-diff-row" :class="classObject">
        <td class="label-tree-diff-row__button">
            <button
                v-if="labelToAdd"
                class="btn btn-sm btn-default"
                :class="addButtonClass"
                :disabled="disabled || null"
                title="Accept the addition"
                @click="emitResolved"
                >
                    <i class="fa fa-plus"></i>
            </button>
            <button
                v-if="labelToRemove"
                class="btn btn-sm btn-default"
                :class="removeButtonClass"
                :title="removeTitle"
                @click="emitResolved"
                :disabled="(!acceptable || disabled) || null"
                >
                    <i class="fa fa-minus"></i>
            </button>
        </td>
        <td class="label-tree-diff-row__left">
            <div v-if="hasLeft" class="label-tree-label" :style="labelStyle">
                <div class="label-tree-label__name">
                    <span class="label-tree-label__color" :style="leftColorStyle"></span>
                    <span v-text="leftLabel.name"></span>
                </div>
            </div>
            <div v-if="labelAdded" class="label-tree-label" :style="labelStyle">
                <div class="label-tree-label__name">
                    <span class="label-tree-label__color" :style="rightColorStyle"></span>
                    <span v-text="rightLabel.name"></span>
                </div>
            </div>
        </td>
        <td class="label-tree-diff-row__right">
            <div class="label-tree-label" :style="labelStyle">
                <div v-if="hasRight" class="label-tree-label__name">
                    <span class="label-tree-label__color" :style="rightColorStyle"></span>
                    <span v-text="rightLabel.name"></span>
                </div>
            </div>
        </td>
    </tr>
</template>

<script>
/**
 * A component that displays a single row of a label tree diff.
 *
 * @type {Object}
 */
export default {
    emits: ['accepted'],
    props: {
        item: {
            type: Object,
            required: true,
        },
        disabled: {
            type: Boolean,
            required: false,
        },
    },
    computed: {
        leftLabel() {
            return this.item.left;
        },
        rightLabel() {
            return this.item.right;
        },
        hasLeft() {
            return this.leftLabel !== null;
        },
        hasRight() {
            return this.rightLabel !== null;
        },
        labelToAdd() {
            return !this.hasLeft && this.hasRight;
        },
        labelToRemove() {
            return this.hasLeft && !this.hasRight;
        },
        labelsSame() {
            return this.hasLeft && this.hasRight;
        },
        leftColorStyle() {
            return {
                'background-color': '#' + this.leftLabel.color,
            };
        },
        rightColorStyle() {
            return {
                'background-color': '#' + this.rightLabel.color,
            };
        },
        classObject() {
            return {
                'success': this.labelToAdd && !this.accepted,
                'label-tree-diff-row--added': this.labelToAdd && this.accepted,
                'danger': this.labelToRemove && !this.accepted,
                'label-tree-diff-row--removed': this.labelToRemove && this.accepted,
            };
        },
        labelStyle() {
            return {
                'padding-left': (this.item.level * 22) + 'px',
            };
        },
        addButtonClass() {
            return {
                'btn-success': this.accepted,
            };
        },
        removeButtonClass() {
            return {
                'btn-danger': this.accepted,
            };
        },
        accepted() {
            return this.item.accepted;
        },
        acceptable() {
            return this.item.acceptable;
        },
        labelAdded() {
            return this.labelToAdd && this.accepted;
        },
        removeTitle() {
            if (this.acceptable) {
                return 'Accept the deletion';
            }

            return 'This label cannot be deleted because it or one of its child labels is used';
        },
    },
    methods: {
        emitResolved() {
            this.$emit('accepted', this.item);
        },
    },
};
</script>
