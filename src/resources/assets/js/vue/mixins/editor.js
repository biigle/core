/**
 * A mixin for view models that have an editing state
 *
 * @type {Object}
 */
biigle.$component('labelTrees.mixins.editor', {
    data: {
        editing: false,
    },
    methods: {
        startEditing: function () {
            this.editing = true;
        },
        finishEditing: function () {
            this.editing = false;
        },
        toggleEditing: function () {
            this.editing = !this.editing;
        },
    },
});
