<template>
    <div class="label-trees">
        <div
            v-if="typeahead || clearable"
            class="label-trees__head"
            >
            <button
                v-if="clearable"
                @click="clear"
                class="btn btn-default"
                title="Clear selected labels"
                type="button"
                >
                <span class="fa fa-times fa-fw" aria-hidden="true"></span>
            </button>
            <typeahead
                ref="typeaheadInput"
                v-if="typeahead"
                more-info="tree.versionedName"
                placeholder="Find label"
                :items="labels"
                @select="handleSelect"
                ></typeahead>
        </div>
        <div class="label-trees__body">

            <label-tree
                v-if="hasFavourites"
                name="Favourites"
                :labels="favourites"
                :show-favourites="showFavourites"
                :flat="true"
                :showFavouriteShortcuts="true"
                :collapsible="collapsible"
                @select="handleSelect"
                @deselect="handleDeselect"
                @remove-favourite="handleRemoveFavourite"
                ></label-tree>
            <label-tree
                v-for="(tree, index) in sortedTrees"
                :key="tree.id"
                :class="{ 'drag-hover': hoverIndex === index }"
                :name="tree.versionedName"
                :labels="tree.labels"
                :multiselect="multiselect"
                :allow-select-siblings="allowSelectSiblings"
                :allow-select-children="allowSelectChildren"
                :show-favourites="showFavourites"
                :collapsible="collapsible"
                @select="handleSelect"
                @deselect="handleDeselect"
                @add-favourite="handleAddFavourite"
                @remove-favourite="handleRemoveFavourite"
                @switch-label-trees="switchLabelTrees"
                ></label-tree>

        </div>
    </div>
</template>

<script>
import Keyboard from '@/core/keyboard.js';
import LabelTree from './labelTree.vue';
import mitt from 'mitt';
import Typeahead from './labelTypeahead.vue';
import {MAX_FAVOURITES} from '../constants.js';

/**
 * A component that displays a list of label trees.
 *
 * @type {Object}
 */
export default {
    emits: [
        'add-favourite',
        'clear',
        'deselect',
        'remove-favourite',
        'select',
    ],
    components: {
        typeahead: Typeahead,
        labelTree: LabelTree,
    },
    data() {
        //Since this can cause empty arrays to be here, filter only number values.
        let projectIds = biigle.$require('volumes.projectIds').concat(biigle.$require('annotations.projectIds')).filter(Number);
        let customOrderStorageKeys = []
        projectIds.forEach((el) => customOrderStorageKeys.push(`biigle.label-trees.${el}.custom-order`))
        return {
            favourites: [],
            customOrder: [],
            sortedTrees: [],
            customOrderStorageKeys: customOrderStorageKeys,
            hoverIndex: null,
        };
    },
    props: {
        trees: {
            type: Array,
            required: true,
        },
        id: {
            type: String,
        },
        typeahead: {
            type: Boolean,
            default: true,
        },
        clearable: {
            type: Boolean,
            default: true,
        },
        multiselect: {
            type: Boolean,
            default: false,
        },
        allowSelectSiblings: {
            type: Boolean,
            default: false,
        },
        allowSelectChildren: {
            type: Boolean,
            default: false,
        },
        showFavourites: {
            type: Boolean,
            default: false,
        },
        //TODO: remember to change this in other JS scripts and set to false as default
        showCustomOrder: {
            type: Boolean,
            default: true,
        },
        collapsible: {
            type: Boolean,
            default: true,
        },
        // Keyboard event listener set to use (in case there are other components using
        // the same shortcut keys on the same page).
        listenerSet: {
            type: String,
            default: 'default',
        },
        focusInput:{
            type: Boolean,
            default: false,
        },
        selectedFavouriteLabel: {
            type: Number,
            default: undefined,
        },
    },
    computed: {
        localeCompareSupportsLocales() {
            try {
              'foo'.localeCompare('bar', 'i');
            } catch (e) {
                return e.name === 'RangeError';
            }

            return false;
        },
        // All labels of all label trees in a flat, sorted list.
        labels() {
            let labels = [];
            this.trees.forEach(function (tree) {
                Array.prototype.push.apply(labels, tree.labels);
            });

            if (this.localeCompareSupportsLocales) {
                // Use this to sort label names "natuarally". This is only supported in
                // modern browsers, though.
                let collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
                labels.sort(function (a, b) {
                    return collator.compare(a.name, b.name);
                });
            } else {
                labels.sort(function (a, b) {
                    return a.name < b.name ? -1 : 1;
                });
            }

            return labels;
        },
        favouriteIds() {
            return this.favourites.map((label) => label.id);
        },
        canHaveMoreFavourites() {
            return this.favourites.length < MAX_FAVOURITES;
        },
        hasFavourites() {
            return this.favourites.length > 0;
        },
        hasCustomOrder() {
            return this.customOrder.length > 0;
        },
        ownId() {
            if (this.id) {
                return this.id;
            }

            let ids = [];
            for (let prop in this.trees) {
                if (!this.trees.hasOwnProperty(prop)) {
                    continue;
                }

                ids.push(this.trees[prop].id);
            }

            return ids.sort().join('-');
        },
        favouriteStorageKey() {
            return `biigle.label-trees.${this.ownId}.favourites`;
        },
        treeIds() {
            return this.trees.reduce((els, obj) =>{
                els.push(obj.id);
                return els;
            }, [])
        }
    },
    methods: {
        handleSelect(label, e) {
            if (label) {
                this.$emit('select', label, e);
                this.events.emit('select', {label, e});
            }
        },
        handleDeselect(label, e) {
            this.$emit('deselect', label, e);
            this.events.emit('deselect', {label, e});
        },
        clear() {
            this.$emit('clear');
            this.events.emit('clear');
        },
        handleAddFavourite(label) {
            if (this.canHaveMoreFavourites) {
                this.$emit('add-favourite', label);
                this.events.emit('add-favourite', label);
                this.favourites.push(label);
                this.updateFavouriteStorage();
            }
        },
        handleRemoveFavourite(label) {
            this.$emit('remove-favourite', label);
            this.events.emit('remove-favourite', label);
            let index = this.favourites.indexOf(label);
            if (index !== -1) {
                this.favourites.splice(index, 1);
            }
            this.updateFavouriteStorage();
        },
        updateFavouriteStorage() {
            if (this.hasFavourites) {
                localStorage.setItem(this.favouriteStorageKey, JSON.stringify(this.favouriteIds));
            } else {
                localStorage.removeItem(this.favouriteStorageKey);
            }
        },
        selectFavourite(index) {
            if (this.favourites[index]) {
                this.handleSelect(this.favourites[index]);
            }
        },
        on(key, fn) {
            this.events.on(key, fn);
        },
        switchLabelTrees(labelTree1, labelTree2) {
            console.log("Switching " + labelTree1 + " with " +labelTree2);
            // If there is no data in local storage, add it
            let idx1 = this.trees.findIndex((tree) => tree.name == labelTree1)
            let idx2 = this.trees.findIndex((tree) => tree.name == labelTree2)

            this.customOrder = this.swapElements(this.treeIds, idx1, idx2)


            //this.customOrderStorageKeys.forEach(function (storageKey) {
                //localStorage.setItem(storageKey, JSON.stringify(this.customOrder));
            //})
        },
        swapElements(arr, idx1, idx2) {
            let element = arr.splice(idx1, 1)[0];
            arr.splice(idx2, 0, element);
            return arr;
        },
        changeCustomOrder() {
            let customOrder = JSON.parse(localStorage.getItem(this.customOrderStorageKey));
            if (customOrder) {
                this.customOrder = customOrder;
            }
        },
    },
    watch: {
        trees: {
            immediate: true,
            deep: true,
            handler(trees) {
                trees.forEach(function (tree) {
                    if (tree.version) {
                        tree.versionedName = tree.name + ' @ ' + tree.version.name;
                    } else {
                        tree.versionedName = tree.name;
                    }

                    tree.labels.forEach(function (label) {
                        label.tree = tree;
                    });
                });
            },
        },
        focusInput() {
            if (this.focusInput) {
                this.$refs.typeaheadInput.$el.querySelector('input').focus();
            }
        },
        selectedFavouriteLabel(index) {
            this.selectFavourite(index);
        },
        customOrder: {
            immediate: true,
            deep: true,
            handler(customOrder) {
                this.sortedTrees.sort(
                    function (a, b) {
                        return customOrder.findIndex((val) => val == a.id) > customOrder.findIndex((val) => val == b.id);
                    }
                )
            }
        },
    },
    created() {
        this.events = mitt();
    },
    mounted() {

        if (this.showFavourites) {
            let favouriteIds = JSON.parse(localStorage.getItem(this.favouriteStorageKey));
            if (favouriteIds) {
                // Keep the ordering of the favourites!
                let favouriteLabels = [];
                this.labels.forEach(function (label) {
                    let index = favouriteIds.indexOf(label.id);
                    if (index !== -1) {
                        favouriteLabels[index] = label;
                    }
                });
                // Remove 'undefined' items in case labels were deleted in the meantime
                favouriteLabels.filter(Boolean).forEach((label) => {
                    this.handleAddFavourite(label);
                });
            }

            let bindFavouriteKey = (key, index) => {
                Keyboard.on(key, () => {
                    this.selectFavourite(index);
                }, 0, this.listenerSet);
            };

            for (let i = 1; i <= 9; i++) {
                bindFavouriteKey(i.toString(), i - 1);
            }
            bindFavouriteKey('0', 9);
        }

      this.sortedTrees = this.trees
      if (this.showCustomOrder) {
            //TODO: merge all projects label trees so that we have one order.
            //TODO: what strategy should we use here? e.g. create a custom stored order for a volume if it is custom done?
            let customOrder = JSON.parse(localStorage.getItem(this.customOrderStorageKey));
            if (customOrder) {
                //Filter out non-existent label trees
                customOrder = customOrder.filter((el) => this.treeIds.includes(el));
                this.customOrder = customOrder;
            }
      }
    },
};
</script>
