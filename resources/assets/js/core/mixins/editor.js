/**
 * A mixin for view models that have an editing state
 *
 * @type {Object}
 */
biigle.$component('core.mixins.editor', {
    data: function () {
        return {
            editing: false,
        };
    },
    methods: {
        startEditing: function () {
            this.editing = true;
            this.$emit('editing.start');
        },
        finishEditing: function () {
            this.editing = false;
            this.$emit('editing.stop');
        },
        toggleEditing: function () {
            if (this.editing) {
                this.finishEditing();
            } else {
                this.startEditing();
            }
        },
    },
});
