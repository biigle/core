/**
 * A component that displays a single row of a label tree diff.
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.labelTreeDiffRow', {
    template: '<div class="label-tree-diff-row" :class="classObject">' +
        '<div class="label-tree-diff-row__button">' +
            '<button ' +
                'v-if="labelToAdd" ' +
                'class="btn btn-sm btn-default" ' +
                ':class="addButtonClass" ' +
                'title="Add the label to the left tree" ' +
                '@click="emitResolved" ' +
                '>' +
                    '<i class="fa fa-plus"></i>' +
            '</button>' +
            '<button ' +
                'v-if="labelToRemove" ' +
                'class="btn btn-sm btn-default" ' +
                ':class="removeButtonClass" ' +
                'title="Remove the label from the left tree" ' +
                '@click="emitResolved" ' +
                '>' +
                    '<i class="fa fa-minus"></i>' +
            '</button>' +
        '</div>' +
        '<div class="label-tree-diff-row__left">' +
            '<div v-if="hasLeft" class="label-tree-label" :style="labelStyle">' +
                '<div class="label-tree-label__name">' +
                    '<span class="label-tree-label__color" :style="leftColorStyle"></span>' +
                    '<span v-text="leftLabel.name"></span>' +
                '</div>' +
            '</div>' +
            '<div v-if="labelAdded" class="label-tree-label" :style="labelStyle">' +
                '<div class="label-tree-label__name">' +
                    '<span class="label-tree-label__color" :style="rightColorStyle"></span>' +
                    '<span v-text="rightLabel.name"></span>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="label-tree-diff-row__right">' +
            '<div class="label-tree-label" :style="labelStyle">' +
                '<div v-if="hasRight" class="label-tree-label__name">' +
                    '<span class="label-tree-label__color" :style="rightColorStyle"></span>' +
                    '<span v-text="rightLabel.name"></span>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>',
    data: function () {
        return {
            //
        };
    },
    props: {
        item: {
            type: Object,
            required: true,
        },
    },
    computed: {
        leftLabel: function () {
            return this.item.left;
        },
        rightLabel: function () {
            return this.item.right;
        },
        hasLeft: function () {
            return this.leftLabel !== null;
        },
        hasRight: function () {
            return this.rightLabel !== null;
        },
        labelToAdd: function () {
            return !this.hasLeft && this.hasRight;
        },
        labelToRemove: function () {
            return this.hasLeft && !this.hasRight;
        },
        labelsSame: function () {
            return this.hasLeft && this.hasRight;
        },
        leftColorStyle: function () {
            return {
                'background-color': '#' + this.leftLabel.color,
            };
        },
        rightColorStyle: function () {
            return {
                'background-color': '#' + this.rightLabel.color,
            };
        },
        classObject: function () {
            return {
                'label-tree-diff-row--to-add': this.labelToAdd && !this.resolved,
                'label-tree-diff-row--added': this.labelToAdd && this.resolved,
                'label-tree-diff-row--to-remove': this.labelToRemove && !this.resolved,
                'label-tree-diff-row--removed': this.labelToRemove && this.resolved,
            };
        },
        labelStyle: function () {
            return {
                'padding-left': (this.item.level * 22) + 'px',
            };
        },
        addButtonClass: function () {
            return {
                'btn-success': this.resolved,
            };
        },
        removeButtonClass: function () {
            return {
                'btn-danger': this.resolved,
            };
        },
        resolved: function () {
            return this.item.resolved;
        },
        labelAdded: function () {
            return this.labelToAdd && this.resolved;
        },
    },
    methods: {
        emitResolved: function () {
            this.$emit('resolved', this.item);
        },
    },
});
