<template>
    <li class="label-tree-label" :class="classObject">
        <div class="label-tree-label__name" @click="toggleOpen" @mouseover="doHover" @mouseleave="dontHover">
            <span v-if="editing">
                <input type="color" class="form-control input-sm label-tree-color-input" v-model="newColor" />
                <input type="text" v-model="newName" v-on:keydown.enter="saveThis" class="form-control input-sm label-tree-label__name-input">
            </span>
            <span v-else>
                <span v-show="showColor" class="label-tree-label__color" :style="colorStyle"></span>
                <span v-show="showChevronDown" class="label-tree-label__chevron label-tree-label__chevron--down" :style="chevronStyle"></span>
                <span v-show="showChevronUp" class="label-tree-label__chevron label-tree-label__chevron--up" :style="chevronStyle"></span>
                <span v-text="label.name" @click.stop="toggleSelect" @mouseenter="dontHover"></span>
            </span>
            <span class="label-tree-label__buttons">
                <span v-if="showFavouriteShortcuts" class="text-muted label-tree-label_position">
                            <span class="fa fa-keyboard" aria-hidden="true" title=""></span>
                            <span v-text="actualPosition"></span>
                </span>
                <button v-if="showFavourites" type="button" class="label-tree-label__favourite" :class="favouriteClass" @click.stop="toggleFavourite" :title="favouriteTitle">
                    <span class="fa fa-star" aria-hidden="true" title=""></span>
                </button>
                <span if="editable">
                    <button v-show="showEditButton" :title="editTitle" @click.stop="editThis" class="btn btn-default btn-xs"><span aria-hidden="true" class="fa fa-pencil-alt"></span></button>
                    <button v-show="editing" :title="deleteTitle" @click.stop="deleteThis" class="btn btn-danger btn-sm"><span aria-hidden="true" class="fa fa-trash"></span></button>
                    <button v-show="editing" title="Save changes" @click.stop="saveThis" class="btn btn-success btn-sm"><span aria-hidden="true" class="fa fa-check"></span></button>
                    <button v-show="editing" title="Revert changes" @click.stop="revertThis" class="btn btn-default btn-sm"><span aria-hidden="true" class="fa fa-times"></span></button>
                </span>
            </span>
        </div>
        <ul v-if="expandable && label.open" class="label-tree__list">
            <label-tree-label :key="child.id" :label="child" :editable="editable" :show-favourites="showFavourites" v-for="child in label.children" @select="emitSelect" @deselect="emitDeselect" @save="emitSave" @delete="emitDelete" @add-favourite="emitAddFavourite" @remove-favourite="emitRemoveFavourite"></label-tree-label>
        </ul>
    </li>
</template>

<script>
/**
 * A component that displays a single label of a label tree.
 *
 * @type {Object}
 */
export default {
    name: 'label-tree-label',
    data() {
        return {
            hover: false,
            editing: false,
            oldName: '',
            oldColor: '',
            newName: '',
            newColor: '',
            internalLabel: null,
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
        showFavouriteShortcuts: {
            type: Boolean,
            default: false,
        },
        position:{
            type: Number,
            default:-1,
        },
    },
    computed: {
        showColor() {
            return !this.expandable || !this.hover;
        },
        showChevronUp() {
            return !this.showColor && this.label.open;
        },
        showChevronDown() {
            return !this.showColor && !this.label.open;
        },
        classObject() {
            return {
                'label-tree-label--selected': this.label.selected,
                'label-tree-label--expandable': this.expandable,
                'label-tree-label--editing': this.editing,
            };
        },
        colorStyle() {
            return {
                'background-color': '#' + this.label.color,
            };
        },
        chevronStyle() {
            return {
                color: '#' + this.label.color,
            };
        },
        favouriteClass() {
            return {
                'selected': this.label.favourite,
            };
        },
        favouriteTitle() {
            return (this.label.favourite ? 'Remove' : 'Add') + ' as favourite';
        },
        editTitle() {
            return 'Edit label ' + this.label.name;
        },
        deleteTitle() {
            return 'Remove label ' + this.label.name;
        },
        expandable() {
            return !this.flat && !!this.label.children;
        },
        showEditButton() {
            return this.editable && this.hover && !this.editing;
        },
        actualPosition(){
            return this.position + 1
        }
    },
    methods: {
        toggleSelect(e) {
            if (this.editing) return;

            e.preventDefault();
            if (this.label.selected) {
                this.$emit('deselect', this.label, e);
            } else {
                this.$emit('select', this.label, e);
            }
        },
        editThis() {
            this.editing = true;
            this.oldName = this.label.name;
            this.oldColor = this.label.color;
            this.newName = this.label.name;
            this.newColor = '#' + this.label.color;
        },
        saveThis() {
            this.internalLabel.name = this.newName;
            this.internalLabel.color = this.newColor.substr(1);
            this.editing = false;

            if (this.oldName !== this.label.name || this.oldColor !== this.label.color) {
                this.emitSave(this.label, () => this.editing = true);
            }
        },
        revertThis() {
            this.editing = false;
            this.internalLabel.name = this.oldName;
            this.internalLabel.color = this.oldColor;
        },
        // a method called 'delete' didn't work
        deleteThis() {
            this.emitDelete(this.label);
        },
        toggleOpen(e) {
            if (this.editing) return;

            // If the label cannot be opened, it will be selected here instead.
            if (this.expandable) {
                this.internalLabel.open = !this.label.open;
            } else {
                this.toggleSelect(e);
            }
        },
        toggleFavourite() {
            if (!this.label.favourite) {
                this.emitAddFavourite(this.label);
            } else {
                this.emitRemoveFavourite(this.label);
            }
        },
        emitSelect(label, e) {
            this.$emit('select', label, e);
        },
        emitDeselect(label, e) {
            this.$emit('deselect', label, e);
        },
        emitDelete(label) {
            this.$emit('delete', label);
        },
        emitSave(label, reject) {
            this.$emit('save', label, reject);
        },
        emitAddFavourite(label) {
            this.$emit('add-favourite', label);
        },
        emitRemoveFavourite(label) {
            this.$emit('remove-favourite', label);
        },
        doHover() {
            this.hover = true;
        },
        dontHover() {
            this.hover = false;
        },
    },
    created() {
        // Dirty workarount for ESlint error that props should not be modified.
        this.internalLabel = this.label;
    },
};
</script>
