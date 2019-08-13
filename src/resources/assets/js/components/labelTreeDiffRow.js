/**
 * A component that displays a single row of a label tree diff.
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.labelTreeDiffRow', {
    template: '<tr class="label-tree-diff-row" :class="classObject">' +
        '<td class="label-tree-diff-row__button">' +
            '<button ' +
                'v-if="labelToAdd" ' +
                'class="btn btn-sm btn-default" ' +
                ':class="addButtonClass" ' +
                ':disabled="disabled" ' +
                'title="Accept the addition" ' +
                '@click="emitResolved" ' +
                '>' +
                    '<i class="fa fa-plus"></i>' +
            '</button>' +
            '<button ' +
                'v-if="labelToRemove" ' +
                'class="btn btn-sm btn-default" ' +
                ':class="removeButtonClass" ' +
                ':title="removeTitle" ' +
                '@click="emitResolved" ' +
                ':disabled="!acceptable || disabled" ' +
                '>' +
                    '<i class="fa fa-minus"></i>' +
            '</button>' +
        '</td>' +
        '<td class="label-tree-diff-row__left">' +
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
        '</td>' +
        '<td class="label-tree-diff-row__right">' +
            '<div class="label-tree-label" :style="labelStyle">' +
                '<div v-if="hasRight" class="label-tree-label__name">' +
                    '<span class="label-tree-label__color" :style="rightColorStyle"></span>' +
                    '<span v-text="rightLabel.name"></span>' +
                '</div>' +
            '</div>' +
        '</td>' +
    '</tr>',
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
        disabled: {
            type: Boolean,
            required: false,
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
                'success': this.labelToAdd && !this.accepted,
                'label-tree-diff-row--added': this.labelToAdd && this.accepted,
                'danger': this.labelToRemove && !this.accepted,
                'label-tree-diff-row--removed': this.labelToRemove && this.accepted,
            };
        },
        labelStyle: function () {
            return {
                'padding-left': (this.item.level * 22) + 'px',
            };
        },
        addButtonClass: function () {
            return {
                'btn-success': this.accepted,
            };
        },
        removeButtonClass: function () {
            return {
                'btn-danger': this.accepted,
            };
        },
        accepted: function () {
            return this.item.accepted;
        },
        acceptable: function () {
            return this.item.acceptable;
        },
        labelAdded: function () {
            return this.labelToAdd && this.accepted;
        },
        removeTitle: function () {
            if (this.acceptable) {
                return 'Accept the deletion';
            }

            return 'This label cannot be deleted because it or one of its child labels is used';
        },
    },
    methods: {
        emitResolved: function () {
            this.$emit('accepted', this.item);
        },
    },
});
