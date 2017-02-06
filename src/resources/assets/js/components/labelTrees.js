/**
 * A component that displays a list of label trees.
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.labelTrees', {
    template: '<div class="label-trees">' +
        '<div v-if="typeahead || clearable" class="label-trees__head">' +
            '<button v-if="clearable" @click="clear" class="btn btn-default" title="Clear selected labels"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>' +
            '<typeahead v-if="typeahead" :items="labels" @select="handleSelect" placeholder="Label name"></typeahead>' +
        '</div>' +
        '<div class="label-trees__body">' +
            '<label-tree v-if="hasFavourites" name="Favourites" :labels="favourites" :show-favourites="showFavourites" @select="handleSelect" @deselect="handleDeselect" @remove-favourite="handleRemoveFavourite"></label-tree>' +
            '<label-tree :name="tree.name" :labels="tree.labels" :multiselect="multiselect" :show-favourites="showFavourites" v-for="tree in trees" @select="handleSelect" @deselect="handleDeselect"  @add-favourite="handleAddFavourite" @remove-favourite="handleRemoveFavourite"></label-tree>' +
        '</div>' +
    '</div>',
    components: {
        typeahead: biigle.$require('core.components.typeahead'),
        labelTree: biigle.$require('labelTrees.components.labelTree'),
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
    },
    computed: {
        // All labels of all label trees in a flat list.
        labels: function () {
            var labels = [];
            for (var i = this.trees.length - 1; i >= 0; i--) {
                Array.prototype.push.apply(labels, this.trees[i].labels);
            }

            return labels;
        },
        favourites: function () {
            return this.labels.filter(function (label) {
                return label.favourite;
            });
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
            this.$emit('select', label);
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
                this.updateFavouriteStorage();
            }
        },
        handleRemoveFavourite: function (label) {
            this.$emit('remove-favourite', label);
            this.updateFavouriteStorage();
        },
        updateFavouriteStorage: function () {
            if (this.hasFavourites) {
                localStorage.setItem(this.favouriteStorageKey, JSON.stringify(this.favouriteIds));
            } else {
                localStorage.removeItem(this.favouriteStorageKey);
            }
        },
    },
    mounted: function () {
        var favouriteIds = JSON.parse(localStorage.getItem(this.favouriteStorageKey));
        if (favouriteIds) {
            for (var i = this.labels.length - 1; i >= 0; i--) {
                if (favouriteIds.indexOf(this.labels[i].id) !== -1) {
                    this.handleAddFavourite(this.labels[i]);
                }
            }
        }
    },
});
