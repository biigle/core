/**
 * A component that displays a single label of a label tree.
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.labelTreeLabel', {
    name: 'label-tree-label',
    template: '<li class="label-tree-label" :class="classObject">' +
        '<div class="label-tree-label__name" @click="toggleOpen" @mouseover="doHover" @mouseleave="dontHover">' +
            '<span v-if="editing">' +
                '<input type="color" class="form-control input-sm label-tree-color-input" v-model="newColor" /> ' +
                '<input type="text" v-model="newName" v-on:keydown.enter="saveThis" class="form-control input-sm label-tree-label__name-input">' +
            '</span>' +
            '<span v-else>' +
                '<span v-show="showColor" class="label-tree-label__color" :style="colorStyle"></span>' +
                '<span v-if="showChevronDown" class="label-tree-label__chevron label-tree-label__chevron--down" :style="chevronStyle"></span>' +
                '<span v-if="showChevronUp" class="label-tree-label__chevron label-tree-label__chevron--up" :style="chevronStyle"></span>' +
                '<span v-text="label.name" @click.stop="toggleSelect" @mouseenter="dontHover"></span>' +
            '</span>' +
            '<span class="label-tree-label__buttons">' +
                '<button v-if="showFavourites" type="button" class="label-tree-label__favourite" :class="favouriteClass" @click.stop="toggleFavourite" :title="favouriteTitle">' +
                    '<span class="fa fa-star" aria-hidden="true" title=""></span>' +
                '</button>' +
                '<button v-if="editable && !editing" :title="editTitle" @click.stop="editThis"><span aria-hidden="true" class="glyphicon glyphicon-pencil"></span></button>' +
                '<button v-if="editing" class="text-danger" :title="deleteTitle" @click.stop="deleteThis"><span aria-hidden="true" class="glyphicon glyphicon-trash"></span></button>' +
                '<button v-if="editing" title="Revert changes" @click.stop="revertThis"><span aria-hidden="true" class="glyphicon glyphicon-remove"></span></button>' +
                '<button v-if="editing" class="text-success" title="Save changes" @click.stop="saveThis"><span aria-hidden="true" class="glyphicon glyphicon-ok"></span></button>' +
            '</span>' +
        '</div>' +
        '<ul v-if="expandable && label.open" class="label-tree__list">' +
            '<label-tree-label :key="child.id" :label="child" :editable="editable" :show-favourites="showFavourites" v-for="child in label.children" @select="emitSelect" @deselect="emitDeselect" @save="emitSave" @delete="emitDelete" @add-favourite="emitAddFavourite" @remove-favourite="emitRemoveFavourite"></label-tree-label>' +
        '</ul>' +
    '</li>',
    data: function () {
        return {
            hover: false,
            editing: false,
            oldName: '',
            oldColor: '',
            newName: '',
            newColor: '',
        };
    },
    props: {
        label: {
            type: Object,
            required: true,
        },
        showFavourites: {
            type: Boolean,
            required: false,
        },
        editable: {
            type: Boolean,
            default: false,
        },
        flat: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        showColor: function () {
            return !this.expandable || !this.hover;
        },
        showChevronUp: function () {
            return !this.showColor && this.label.open;
        },
        showChevronDown: function () {
            return !this.showColor && !this.label.open;
        },
        classObject: function () {
            return {
                'label-tree-label--selected': this.label.selected,
                'label-tree-label--expandable': this.expandable,
                'label-tree-label--editing': this.editing,
            };
        },
        colorStyle: function () {
            return {
                'background-color': '#' + this.label.color,
            };
        },
        chevronStyle: function () {
            return {
                color: '#' + this.label.color,
            };
        },
        favouriteClass: function () {
            return {
                'selected': this.label.favourite,
            };
        },
        favouriteTitle: function () {
            return (this.label.favourite ? 'Remove' : 'Add') + ' as favourite';
        },
        editTitle: function () {
            return 'Edit label ' + this.label.name;
        },
        deleteTitle: function () {
            return 'Remove label ' + this.label.name;
        },
        expandable: function () {
            return !this.flat && !!this.label.children;
        },
    },
    methods: {
        toggleSelect: function () {
            if (this.editing) return;

            if (this.label.selected) {
                this.$emit('deselect', this.label);
            } else {
                this.$emit('select', this.label);
            }
        },
        editThis: function () {
            this.editing = true;
            this.oldName = this.label.name;
            this.oldColor = this.label.color;
            this.newName = this.label.name;
            this.newColor = '#' + this.label.color;
        },
        saveThis: function () {
            var self = this;
            this.label.name = this.newName;
            this.label.color = this.newColor.substr(1);
            this.editing = false;

            if (this.oldName !== this.label.name || this.oldColor !== this.label.color) {
                this.emitSave(this.label, function () {
                    self.editing = true;
                });
            }
        },
        revertThis: function () {
            this.editing = false;
            this.label.name = this.oldName;
            this.label.color = this.oldColor;
        },
        // a method called 'delete' didn't work
        deleteThis: function () {
            this.emitDelete(this.label);
        },
        toggleOpen: function () {
            if (this.editing) return;

            // If the label cannot be opened, it will be selected here instead.
            if (this.expandable) {
                this.label.open = !this.label.open;
            } else {
                this.toggleSelect();
            }
        },
        toggleFavourite: function () {
            if (!this.label.favourite) {
                this.emitAddFavourite(this.label);
            } else {
                this.emitRemoveFavourite(this.label);
            }
        },
        emitSelect: function (label) {
            this.$emit('select', label);
        },
        emitDeselect: function (label) {
            this.$emit('deselect', label);
        },
        emitDelete: function (label) {
            this.$emit('delete', label);
        },
        emitSave: function (label, reject) {
            this.$emit('save', label, reject);
        },
        emitAddFavourite: function (label) {
            this.$emit('add-favourite', label);
        },
        emitRemoveFavourite: function (label) {
            this.$emit('remove-favourite', label);
        },
        doHover: function () {
            this.hover = true;
        },
        dontHover: function () {
            this.hover = false;
        },
    },
});
