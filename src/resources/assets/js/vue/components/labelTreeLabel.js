/**
 * A component that displays a single label of a label tree.
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.labelTreeLabel', {
    name: 'label-tree-label',
    template: '<li class="label-tree-label cf" :class="classObject">' +
        '<div class="label-tree-label__name" @click="toggleOpen">' +
            '<span class="label-tree-label__color" :style="colorStyle"></span>' +
            '<span v-text="label.name" @click.stop="toggleSelect"></span>' +
            '<span v-if="showFavourite" class="label-tree-label__favourite" @click.stop="toggleFavourite">' +
                '<span class="glyphicon" :class="favouriteClass" aria-hidden="true" title=""></span>' +
            '</span>' +
            '<button v-if="deletable" type="button" class="close label-tree-label__delete" :title="deleteTitle" @click.stop="deleteThis"><span aria-hidden="true">&times;</span></button>' +
        '</div>' +
        '<ul v-if="label.open" class="label-tree__list">' +
            '<label-tree-label :label="child" :deletable="deletable" v-for="child in label.children" @select="emitSelect" @deselect="emitDeselect" @delete="emitDelete"></label-tree-label>' +
        '</ul>' +
    '</li>',
    data: function () {
        return {
            favourite: false
        };
    },
    props: {
        label: {
            type: Object,
            required: true,
        },
        showFavourite: {
            type: Boolean,
            required: false,
        },
        deletable: {
            type: Boolean,
            default: false,
        }
    },
    computed: {
        classObject: function () {
            return {
                'label-tree-label--selected': this.label.selected,
                'label-tree-label--expandable': this.label.children,
            };
        },
        colorStyle: function () {
            return {
                'background-color': '#' + this.label.color
            };
        },
        favouriteClass: function () {
            return {
                'glyphicon-star-empty': !this.favourite,
                'glyphicon-star': this.favourite,
            };
        },
        deleteTitle: function () {
            return 'Remove label ' + this.label.name;
        }
    },
    methods: {
        toggleSelect: function () {
            if (!this.label.selected) {
                this.$emit('select', this.label);
            } else {
                this.$emit('deselect', this.label);
            }
        },
        // a method called 'delete' didn't work
        deleteThis: function () {
            this.emitDelete(this.label);
        },
        toggleOpen: function () {
            // If the label cannot be opened, it will be selected here instead.
            if (!this.label.children) {
                this.toggleSelect();
            } else {
                this.label.open = !this.label.open;
            }
        },
        toggleFavourite: function () {
            this.favourite = !this.favourite;
        },
        emitSelect: function (label) {
            // bubble the event upwards
            this.$emit('select', label);
        },
        emitDeselect: function (label) {
            // bubble the event upwards
            this.$emit('deselect', label);
        },
        emitDelete: function (label) {
            // bubble the event upwards
            this.$emit('delete', label);
        }
    }
});
