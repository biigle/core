/**
 * A a list component of the entity chooser
 *
 * @type {Object}
 */
biigle.$component('sync.components.entityChooserList', {
    template: '#entity-chooser-list-template',
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
    computed: {
        //
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
