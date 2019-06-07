/**
 * A component that displays a list of label trees.
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.labelTrees', {
    template: '<div class="label-trees">' +
        '<div v-if="typeahead || clearable" class="label-trees__head">' +
            '<button v-if="clearable" @click="clear" class="btn btn-default" title="Clear selected labels" type="button"><span class="fa fa-times fa-fw" aria-hidden="true"></span></button>' +
            '<typeahead v-if="typeahead" :items="labels" :template="typeaheadTemplate" @select="handleSelect" placeholder="Label name"></typeahead>' +
        '</div>' +
        '<div class="label-trees__body">' +
            '<label-tree v-if="hasFavourites" name="Favourites" :labels="favourites" :show-favourites="showFavourites" :flat="true" :collapsible="collapsible" @select="handleSelect" @deselect="handleDeselect" @remove-favourite="handleRemoveFavourite"></label-tree>' +
            '<label-tree :name="tree.versionedName" :labels="tree.labels" :multiselect="multiselect" :show-favourites="showFavourites" :collapsible="collapsible" v-for="tree in trees" @select="handleSelect" @deselect="handleDeselect"  @add-favourite="handleAddFavourite" @remove-favourite="handleRemoveFavourite"></label-tree>' +
        '</div>' +
    '</div>',
    components: {
        typeahead: biigle.$require('labelTrees.components.labelTypeahead'),
        labelTree: biigle.$require('labelTrees.components.labelTree'),
    },
    data: function () {
        return {
            favourites: [],
            typeaheadTemplate: '<span v-text="item.name"></span><br><small v-text="item.tree.versionedName"></small>',
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
    },
    computed: {
        localeCompareSupportsLocales: function () {
            try {
              'foo'.localeCompare('bar', 'i');
            } catch (e) {
                return e.name === 'RangeError';
            }

            return false;
        },
        // All labels of all label trees in a flat, sorted list.
        labels: function () {
            var labels = [];
            this.trees.forEach(function (tree) {
                Array.prototype.push.apply(labels, tree.labels);
            });

            if (this.localeCompareSupportsLocales) {
                // Use this to sort label names "natuarally". This is only supported in
                // modern browsers, though.
                var collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
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
        favouriteIds: function () {
            return this.favourites.map(function (label) {
                return label.id;
            });
        },
        canHaveMoreFavourites: function () {
            return this.favourites.length < 10;
        },
        hasFavourites: function () {
            return this.favourites.length > 0;
        },
        ownId: function () {
            if (this.id) {
                return this.id;
            }

            var ids = [];
            for (var prop in this.trees) {
                if (!this.trees.hasOwnProperty(prop)) {
                    continue;
                }

                ids.push(this.trees[prop].id);
            }

            return ids.join('-');
        },
        favouriteStorageKey: function () {
            return 'biigle.label-trees.' + this.ownId + '.favourites';
        },
    },
    methods: {
        handleSelect: function (label) {
            if (label) {
                this.$emit('select', label);
            }
        },
        handleDeselect: function (label) {
            this.$emit('deselect', label);
        },
        clear: function () {
            this.$emit('clear');
        },
        handleAddFavourite: function (label) {
            if (this.canHaveMoreFavourites) {
                this.$emit('add-favourite', label);
                this.favourites.push(label);
                this.updateFavouriteStorage();
            }
        },
        handleRemoveFavourite: function (label) {
            this.$emit('remove-favourite', label);
            var index = this.favourites.indexOf(label);
            if (index !== -1) {
                this.favourites.splice(index, 1);
            }
            this.updateFavouriteStorage();
        },
        updateFavouriteStorage: function () {
            if (this.hasFavourites) {
                localStorage.setItem(this.favouriteStorageKey, JSON.stringify(this.favouriteIds));
            } else {
                localStorage.removeItem(this.favouriteStorageKey);
            }
        },
        selectFavourite: function (index) {
            if (this.favourites[index]) {
                this.handleSelect(this.favourites[index]);
            }
        },
    },
    watch: {
        trees: {
            immediate: true,
            handler: function (trees) {
                trees.forEach(function (tree) {
                    if (tree.version) {
                        tree.versionedName = tree.name + ' @ ' + tree.version.name;
                    } else {
                        tree.versionedName = tree.name;
                    }

                    tree.labels.forEach(function (label) {
                        label.tree = tree;
                    });
                }, this);
            },
        },
    },
    mounted: function () {
        if (this.showFavourites) {
            var favouriteIds = JSON.parse(localStorage.getItem(this.favouriteStorageKey));
            if (favouriteIds) {
                // Keep the ordering of the favourites!
                var favouriteLabels = [];
                this.labels.forEach(function (label) {
                    var index = favouriteIds.indexOf(label.id);
                    if (index !== -1) {
                        favouriteLabels[index] = label;
                    }
                });
                // Remove 'undefined' items in case labels were deleted in the meantime
                favouriteLabels.filter(Boolean).forEach(function (label) {
                    this.handleAddFavourite(label);
                }, this);
            }

            var keyboard = biigle.$require('keyboard');
            var self = this;

            var bindFavouriteKey = function (key, index) {
                keyboard.on(key, function() {
                    self.selectFavourite(index);
                }, 0, self.listenerSet);
            };

            for (var i = 1; i <= 9; i++) {
                bindFavouriteKey(i.toString(), i - 1);
            }
            bindFavouriteKey('0', 9);
        }
    },
});
