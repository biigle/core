<template>
    <div class="label-trees">
        <div v-if="typeahead || clearable" class="label-trees__head">
            <button v-if="clearable" @click="clear" class="btn btn-default" title="Clear selected labels" type="button"><span class="fa fa-times fa-fw" aria-hidden="true"></span></button>
            <typeahead ref="typeaheadInput" v-if="typeahead" :items="labels" more-info="tree.versionedName" @select="handleSelect" placeholder="Find label"></typeahead>
        </div>
        <div class="label-trees__body">
            <label-tree v-if="hasFavourites" name="Favourites" :labels="favourites" :show-favourites="showFavourites" :flat="true" :showFavouriteShortcuts="true" :collapsible="collapsible" @select="handleSelect" @deselect="handleDeselect" @remove-favourite="handleRemoveFavourite"></label-tree>
            <label-tree v-for="tree in trees" :key="tree.id" :name="tree.versionedName" :labels="tree.labels" :multiselect="multiselect" :allow-select-siblings="allowSelectSiblings" :allow-select-children="allowSelectChildren" :show-favourites="showFavourites" :collapsible="collapsible" @select="handleSelect" @deselect="handleDeselect"  @add-favourite="handleAddFavourite" @remove-favourite="handleRemoveFavourite"></label-tree>
        </div>
    </div>
</template>

<script>
import Keyboard from '@/core/keyboard.js';
import LabelTree from './labelTree.vue';
import Typeahead from './labelTypeahead.vue';
import {MAX_FAVOURITES} from '../constants.js';

/**
 * A component that displays a list of label trees.
 *
 * @type {Object}
 */
export default {
    components: {
        typeahead: Typeahead,
        labelTree: LabelTree,
    },
    data() {
        return {
            favourites: [],
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
        }
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

            return ids.join('-');
        },
        favouriteStorageKey() {
            return `biigle.label-trees.${this.ownId}.favourites`;
        },
    },
    methods: {
        handleSelect(label, e) {
            if (label) {
                this.$emit('select', label, e);
            }
        },
        handleDeselect(label, e) {
            this.$emit('deselect', label, e);
        },
        clear() {
            this.$emit('clear');
        },
        handleAddFavourite(label) {
            if (this.canHaveMoreFavourites) {
                this.$emit('add-favourite', label);
                this.favourites.push(label);
                this.updateFavouriteStorage();
            }
        },
        handleRemoveFavourite(label) {
            this.$emit('remove-favourite', label);
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
    },
    watch: {
        trees: {
            immediate: true,
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
        }

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
    },
};
</script>
