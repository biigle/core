/**
 * A component for a form to manually create a new label for a label tree
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.manualLabelForm', {
    mixins: [biigle.$require('labelTrees.mixins.labelFormComponent')],
    methods: {
        submit: function () {
            var label = {
                name: this.selectedName,
                color: this.selectedColor,
            };

            if (this.parent) {
                label.parent_id = this.parent.id;
            }

            this.$emit('submit', label);
        }
    },
});
