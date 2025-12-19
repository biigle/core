<template>
    <div class="label-tree">
        <div
            class="label-tree__title-container"
            >
            <h4
                v-if="showTitle"
                @click="collapse"
                class="label-tree__title"
                :title="collapseTitle"
                :class="titleClass"
                >
                {{ name }}
                <div v-if="showSortingArrows" class="btn-group label-tree__move-buttons">
                    <button
                        v-if="showMoveButtonUp"
                        type="button"
                        class="btn btn-default btn-xs"
                        @click.stop="emitMoveLabelTree(true)"
                        title="Move the label tree up"
                        >
                        <span class="fa fa-arrow-up" aria-hidden="true"></span>
                    </button>
                    <button
                        v-if="showMoveButtonDown"
                        type="button"
                        class="btn btn-default btn-xs"
                        @click.stop="emitMoveLabelTree(false)"
                        title="Move the label tree down"
                        >
                        <span class="fa fa-arrow-down" aria-hidden="true"></span>
                    </button>
                </div>
            </h4>
        </div>
        <ul v-if="!collapsed" class="label-tree__list">
            <label-tree-label
                v-for="(label, index) in rootLabels"
                :key="label.id"
                :label="label"
                :editable="editable"
                :show-favourites="showFavourites"
                :flat="flat"
                :showFavouriteShortcuts="showFavouriteShortcuts"
                :position="index"
                @select="emitSelect"
                @deselect="emitDeselect"
                @save="emitSave"
                @delete="emitDelete"
                @add-favourite="emitAddFavourite"
                @remove-favourite="emitRemoveFavourite"
                ></label-tree-label>
            <li v-if="hasNoLabels" class="text-muted">No labels</li>
        </ul>
    </div>
</template>

<script>
import LabelTreeLabel from './labelTreeLabel.vue';

/**
 * A component that displays a label tree. The labels can be searched and selected.
 *
 * @type {Object}
 */
export default {
    emits: [
        'add-favourite',
        'delete',
        'deselect',
        'remove-favourite',
        'save',
        'select',
        'move-label-trees',
    ],
    data() {
        return {
            collapsed: false,
        };
    },
    components: {
        labelTreeLabel: LabelTreeLabel,
    },
    props: {
        name: {
            type: String,
            required: true,
        },
        labels: {
            type: Array,
            required: true,
        },
        showTitle: {
            type: Boolean,
            default: true,
        },
        // If false the label tree assumes it is used in a label-trees component.
        standalone: {
            type: Boolean,
            default: false,
        },
        collapsible: {
            type: Boolean,
            default: true,
        },
        // Indicates whether multiple labels can be selected at the same time.
        multiselect: {
            type: Boolean,
            default: false,
        },
        // Indicates whether labels can be selected with Alt to select all sibling
        // labels, too.
        allowSelectSiblings: {
            type: Boolean,
            default: false,
        },
        // Indicates whether labels can be selected with Crtl to select all child
        // labels, too.
        allowSelectChildren: {
            type: Boolean,
            default: false,
        },
        // Indicates whether labels can be edited.
        editable: {
            type: Boolean,
            default: false,
        },
        // Indicates whether labels can be selected as favourites.
        showFavourites: {
            type: Boolean,
            default: false,
        },
        // Indicates whether labels can be sorted.
        showSortingArrows: {
            type: Boolean,
            default: true,
        },
        // Indicates whether the labels should be displayed in a flat list instead of a tree.
        flat: {
            type: Boolean,
            default: false,
        },
        // Indicates whether shortcuts of favourites are shown.
        showFavouriteShortcuts: {
            type: Boolean,
            default: false,
        },
        treeIndex: {
            type: Number,
            default: -1,
        },
        maxTreeIndex: {
            type: Number,
            default: -1,
        }
    },
    computed: {
        labelMap() {
            let map = {};
            for (let i = this.labels.length - 1; i >= 0; i--) {
                map[this.labels[i].id] = this.labels[i];
            }

            return map;
        },
        compiledLabels() {
            let compiled = {null: []};

            if (this.flat) {
                this.labels.forEach(function (label) {
                    compiled[null].push(label);
                });
            } else {
                // Create datastructure that maps label IDs to the child labels.
                this.labels.forEach(function (label) {
                    if (compiled.hasOwnProperty(label.parent_id)) {
                        compiled[label.parent_id].push(label);
                    } else {
                        compiled[label.parent_id] = [label];
                    }
                });

                // update the label children with the compiled datastructure
                this.labels.forEach(function (label) {
                    if (compiled.hasOwnProperty(label.id)) {
                        label.children = compiled[label.id];
                    } else {
                        label.children = undefined;
                        // If the last child was deleted, close the label.
                        label.open = false;
                    }
                });
            }

            return compiled;
        },
        rootLabels() {
            return this.compiledLabels[null];
        },
        collapseTitle() {
            if (this.collapsible) {
                return this.collapsed ? 'Expand' : 'Collapse';
            }
            return "";
        },
        hasNoLabels() {
            return this.rootLabels.length === 0;
        },
        showMoveButtonUp() {
            return this.treeIndex !== 0;
        },
        showMoveButtonDown() {
            return this.treeIndex !== this.maxTreeIndex;
        },
        titleClass() {
            return this.collapsed ? 'text-muted' : '';
        },
    },
    methods: {
        hasLabel(id) {
            return this.labelMap.hasOwnProperty(id);
        },
        getLabel(id) {
            return this.labelMap[id];
        },
        getParents(label) {
            let parents = [];
            while (label.parent_id !== null) {
                label = this.getLabel(label.parent_id);
                parents.unshift(label.id);
            }

            return parents;
        },
        getSiblings(label) {
            if (label.parent_id === null) {
                return this.rootLabels;
            }

            let parent = this.getLabel(label.parent_id);

            return parent.children;
        },
        selectSiblings(label) {
            this.getSiblings(label).forEach(function (label) {
                label.selected = true;
            });
        },
        deselectSiblings(label) {
            this.getSiblings(label).forEach(function (label) {
                label.selected = false;
            });
        },
        selectChildren(label) {
            if (label.children) {
                label.children.forEach((child) => {
                    child.selected = true;
                    this.selectChildren(child);
                });
            }
        },
        deselectChildren(label) {
            if (label.children) {
                label.children.forEach((child) => {
                    child.selected = false;
                    this.deselectChildren(child);
                });
            }
        },
        emitSelect(label, e) {
            this.$emit('select', label, e);
            if (this.standalone) {
                this.selectLabel({label, e});
            }
        },
        emitDeselect(label, e) {
            this.$emit('deselect', label, e);
            if (this.standalone) {
                this.deselectLabel({label, e});
            }
        },
        emitSave(label, reject) {
            this.$emit('save', label, reject);
        },
        emitDelete(label) {
            this.$emit('delete', label);
        },
        conditionSelectSiblings(e) {
            if (!e) {
                return false;
            }
            return this.allowSelectSiblings && e.altKey;
        },
        conditionSelectChildren(e) {
            if (!e) {
                return false;
            }
            return this.allowSelectChildren && e.ctrlKey;
        },
        selectLabel(args) {
            const {label, e} = args;
            if (!this.multiselect) {
                this.clearSelectedLabels();
            }

            // The selected label does not neccesarily belong to this label tree since
            // the tree may be displayed in a label-trees component with other trees.
            if (label && this.hasLabel(label.id)) {
                label.selected = true;
                this.collapsed = false;
                if (!this.flat) {
                    this.getParents(label).forEach((id) => {
                        this.getLabel(id).open = true;
                    });

                    if (this.multiselect) {
                        if (this.conditionSelectSiblings(e)) {
                            this.selectSiblings(label);
                        }

                        if (this.conditionSelectChildren(e)) {
                            this.selectChildren(label);

                            if (this.conditionSelectSiblings(e)) {
                                this.getSiblings(label).forEach(this.selectChildren);
                            }
                        }
                    }
                }
            }
        },
        deselectLabel(args) {
            const {label, e} = args;
            if (this.hasLabel(label.id)) {
                label.selected = false;

                if (this.conditionSelectSiblings(e)) {
                    this.deselectSiblings(label);
                }

                if (this.conditionSelectChildren(e)) {
                    this.deselectChildren(label);

                    if (this.conditionSelectSiblings(e)) {
                        this.getSiblings(label).forEach(this.deselectChildren);
                    }
                }
            }
        },
        clearSelectedLabels() {
            this.labels.forEach(function (label) {
                label.selected = false;
            });
        },
        collapse() {
            if (this.collapsed) {
                this.collapsed = false;
            } else {
                let hadExpandedLabels = false;
                // Collapse all labels if there are any expanded.
                this.labels.forEach(function (label) {
                    hadExpandedLabels |= label.open;
                    label.open = false;
                });

                // If there were no expanded labels, collapse the whole tree.
                this.collapsed = !hadExpandedLabels;
            }
        },
        emitAddFavourite(label) {
            this.$emit('add-favourite', label);
        },
        emitRemoveFavourite(label) {
            this.$emit('remove-favourite', label);
        },
        addFavouriteLabel(label) {
            if (this.hasLabel(label.id)) {
                label.favourite = true;
            }
        },
        removeFavouriteLabel(label) {
            if (this.hasLabel(label.id)) {
                label.favourite = false;
            }
        },
        emitMoveLabelTree(moveUp) {
            let targetIdx = moveUp ? this.treeIndex - 1 : this.treeIndex + 1;
            this.$emit(
                'move-label-trees',
                this.treeIndex,
                targetIdx,
            );
        }
    },
    created() {
        // Set the reactive label properties
        this.labels.forEach(function (label) {
            if (!label.hasOwnProperty('open')) {
                label.open = false;
            }

            if (!label.hasOwnProperty('selected')) {
                label.selected = false;
            }

            if (!label.hasOwnProperty('favourite')) {
                label.favourite = false;
            }
        });

        // The label tree can be used in a label-trees component or as a single label
        // tree. In a label-trees component only one label can be selected in all label
        // trees so the parent handles the event. A single label tree handles the event
        // by itself.
        if (!this.standalone) {
            this.$parent.on('select', this.selectLabel);
            this.$parent.on('deselect', this.deselectLabel);
            this.$parent.on('clear', this.clearSelectedLabels);
            // Label favourites only work with the label-trees component.
            this.$parent.on('add-favourite', this.addFavouriteLabel);
            this.$parent.on('remove-favourite', this.removeFavouriteLabel);
        }
    },
};
</script>
