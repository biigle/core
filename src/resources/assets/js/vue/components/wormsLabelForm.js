/**
 * A component for a form to manually create a new label for a label tree
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.wormsLabelForm', {
    mixins: [biigle.$require('labelTrees.mixins.labelFormComponent')],
    components: {
        wormsResultItem: biigle.$require('labelTrees.components.wormsResultItem'),
    },
    data: function () {
        return {
            results: [],
            recursive: false,
            hasSearched: false,
        };
    },
    computed: {
        hasResults: function () {
            return this.results.length > 0;
        }
    },
    methods: {
        submit: function () {
            // this.$emit('submit');
        },
        findName: function () {
            var worms = biigle.$require('labelTrees.wormsLabelSource');
            var labelSource = biigle.$require('api.labelSource');
            var messages = biigle.$require('messages.store');
            var self = this;
            this.$emit('load-start');

            labelSource.query({id: worms.id, query: this.selectedName})
                .then(this.updateResults, messages.handleErrorResponse)
                .finally(function () {
                    self.hasSearched = true;
                    self.$emit('load-finish');
                });
        },
        updateResults: function (response) {
            this.results = response.data;
        },
        importItem: function (item) {
            var worms = biigle.$require('labelTrees.wormsLabelSource');

            var label = {
                name: item.name,
                color: this.selectedColor,
                source_id: item.aphia_id,
                label_source_id: worms.id,
            };

            if (this.recursive) {
                label.recursive = 'true';
            } else if (this.parent) {
                label.parent_id = this.parent.id;
            }

            this.$emit('submit', label);
        }
    },
});
