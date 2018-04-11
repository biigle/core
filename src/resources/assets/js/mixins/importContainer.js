/**
 * A mixin for the import view models
 *
 * @type {Object}
 */
biigle.$component('sync.mixins.importContainer', {
    mixins: [biigle.$require('core.mixins.loader')],
    components: {
        entityChooser: biigle.$require('sync.components.entityChooser'),
    },
    data: function () {
        return {
            success: false,
        };
    },
    methods: {
        importSuccess: function () {
            this.success = true;
        },
    },
});
