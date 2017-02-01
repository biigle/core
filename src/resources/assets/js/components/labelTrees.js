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
            '<label-tree :name="tree.name" :labels="tree.labels" :multiselect="multiselect" v-for="tree in trees" @select="handleSelect" @deselect="handleDeselect"></label-tree>' +
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
        }
    },
    computed: {
        // All labels of all label trees in a flat list.
        labels: function () {
            var labels = [];
            for (var i = this.trees.length - 1; i >= 0; i--) {
                Array.prototype.push.apply(labels, this.trees[i].labels);
            }

            return labels;
        }
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
        }
    }
});
