/**
 * A a list component of the entity chooser
 *
 * @type {Object}
 */
biigle.$component('sync.components.entityChooserList', {
    template: '<div class="entity-chooser-list">' +
        '<input type="text" class="form-control entity-chooser-list-search" placeholder="Filter..." v-model="filterQuery" v-if="filtering">' +
        '<ul>' +
            '<li v-for="e in entities" @click="select(e)">' +
                '<span v-text="e.name"></span>' +
                '<span v-if="true"><br><span class="text-muted" v-text="e.description"></span></span>' +
            '</li>' +
        '</ul>' +
    '</div>',
    props: {
        entities: {
            type: Array,
            required: true,
        },
        filtering: {
            type: Boolean,
            default: false,
        },
    },
    data: function () {
        return {
            filterQuery: '',
        };
    },
    methods: {
        select: function (entity) {
            this.$emit('select', entity);
        },
    },
    watch: {
        filterQuery: function (query) {
            this.$emit('filter', query);
        },
    },
});
