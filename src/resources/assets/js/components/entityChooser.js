/**
 * A component to choose entities like volumes or users for a list
 *
 * @type {Object}
 */
biigle.$component('sync.components.entityChooser', {
    template: '#entity-chooser-template',
    components: {
        entityChooserList: biigle.$require('sync.components.entityChooserList'),
    },
    props: {
        entities: {
            type: Array,
            required: true,
        },
    },
    data: function () {
        return {
            chosenIds: {},
            filterQuery: '',
        };
    },
    computed: {
        unchosenEntities: function () {
            return this.entities.filter(function (entity) {
                return !this.chosenIds[entity.id];
            }, this);
        },
        unchosenFilteredEntities: function () {
            // This is a very simple fuzzy matching. It splits the query string at the
            // spaces into "parts" and returns any entity whose name contains all parts.
            // Example: "iv hau" matches the entity "Hausgarten IV PS62/161-3"
            var query = this.filterQuery.trim();
            if (query) {
                var queryParts = query.toLowerCase().split(' ');
                return this.unchosenEntities.filter(function (entity) {
                    var name = entity.name.toLowerCase();
                    return queryParts.reduce(function (match, part) {
                        return match && name.indexOf(part) !== -1;
                    }, true);
                });
            }

            return this.unchosenEntities;
        },
        chosenEntities: function () {
            return this.entities.filter(function (entity) {
                return this.chosenIds[entity.id];
            }, this);
        },
        hasNoUnchosenEntities: function () {
            return this.unchosenEntities.length === 0;
        },
        hasNoChosenEntities: function () {
            return this.chosenEntities.length === 0;
        },
    },
    methods: {
        handleSelect: function (entity) {
            Vue.set(this.chosenIds, entity.id, true);
        },
        handleDeselect: function (entity) {
            this.chosenIds[entity.id] = false;
        },
        chooseAll: function () {
            this.unchosenFilteredEntities.forEach(this.handleSelect);
        },
        chooseNone: function () {
            this.chosenEntities.forEach(this.handleDeselect);
        },
        handleFiltering: function (query) {
            this.filterQuery = query;
        },
    },
    watch: {
        chosenEntities: function (entities) {
            this.$emit('select', entities);
        },
    },
});
