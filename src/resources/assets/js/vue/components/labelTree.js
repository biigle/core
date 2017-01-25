/**
 * A component that displays a label tree. The labels can be searched and selected.
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.labelTree', {
    template: '<div class="label-tree">' +
        '<h4 class="label-tree__title" :if="showTitle">' +
            '<button v-if="collapsible" @click.stop="collapse" class="btn btn-default btn-xs pull-right" :title="collapseTitle">' +
                '<span v-if="collapsed" class="glyphicon glyphicon-chevron-down" aria-hidden="true"></span>' +
                '<span v-else class="glyphicon glyphicon-chevron-up" aria-hidden="true"></span>' +
            '</button>' +
            '{{tree.name}}' +
        '</h4>' +
        '<ul v-if="!collapsed" class="label-tree__list">' +
            '<label-tree-label :label="label" v-for="label in rootLabels" @select="emitSelect" @deselect="emitDeselect"></label-tree-label>' +
        '</ul>' +
    '</div>',
    data: function () {
        return {
            collapsed: false
        };
    },
    components: {
        labelTreeLabel: biigle.$require('geo.components.labelTreeLabel'),
    },
    props: {
        tree: {
            type: Object,
            required: true,
        },
        showTitle: {
            type: Boolean,
            default: true,
        },
        standalone: {
            type: Boolean,
            default: false,
        },
        collapsible: {
            type: Boolean,
            default: true,
        },
        multiselect: {
            type: Boolean,
            default: false,
        }
    },
    computed: {
        labels: function () {
            return this.tree.labels;
        },
        labelMap: function () {
            var map = {};
            for (var i = this.labels.length - 1; i >= 0; i--) {
                map[this.labels[i].id] = this.labels[i];
            }

            return map;
        },
        compiledLabels: function () {
            var compiled = {};
            var parent;
            // Create datastructure that maps label IDs to the child labels
            for (var i = this.labels.length - 1; i >= 0; i--) {
                parent = this.labels[i].parent_id;
                if (compiled.hasOwnProperty(parent)) {
                    compiled[parent].push(this.labels[i]);
                } else {
                    compiled[parent] = [this.labels[i]];
                }
            }

            return compiled;
        },
        rootLabels: function () {
            return this.compiledLabels[null];
        },
        collapseTitle: function () {
            return this.collapsed ? 'Expand' : 'Collapse';
        }
    },
    methods: {
        hasLabel: function (id) {
            return this.labelMap.hasOwnProperty(id);
        },
        getLabel: function (id) {
            return this.labelMap[id];
        },
        getParents: function (label) {
            var parents = [];
            while (label.parent_id !== null) {
                label = this.getLabel(label.parent_id);
                parents.unshift(label.id);
            }

            return parents;
        },
        emitSelect: function (label) {
            this.$emit('select', label);
        },
        emitDeselect: function (label) {
            this.$emit('deselect', label);
        },
        selectLabel: function (label) {
            if (!this.multiselect) {
                this.clearSelectedLabels();
            }

            // The selected label does not nessecarily belong to this label tree since
            // the tree may be displayed in a label-trees component with other trees.
            if (this.hasLabel(label.id)) {
                label.selected = true;
                this.collapsed = false;
                var parents = this.getParents(label);
                for (var i = parents.length - 1; i >= 0; i--) {
                    this.getLabel(parents[i]).open = true;
                }
            }
        },
        deselectLabel: function (label) {
            if (this.hasLabel(label.id)) {
                label.selected = false;
            }
        },
        clearSelectedLabels: function () {
            for (var i = this.labels.length - 1; i >= 0; i--) {
                this.labels[i].selected = false;
            }
        },
        collapse: function () {
            this.collapsed = !this.collapsed;
        }
    },
    created: function () {
        // Set the label properties
        var compiled = this.compiledLabels;
        for (i = this.labels.length - 1; i >= 0; i--) {
            if (compiled.hasOwnProperty(this.labels[i].id)) {
                Vue.set(this.labels[i], 'children', compiled[this.labels[i].id]);
            }

            Vue.set(this.labels[i], 'open', false);
            Vue.set(this.labels[i], 'selected', false);
        }

        // The label tree can be used in a label-trees component or as a single label
        // tree. In a label-trees component only one label can be selected in all label
        // trees so the parent handles the event. A single label tree handley the event
        // by itself.
        if (this.standalone) {
            this.$on('select', this.selectLabel);
            this.$on('deselect', this.deselectLabel);
        } else {
            this.$parent.$on('select', this.selectLabel);
            this.$parent.$on('deselect', this.deselectLabel);
            this.$parent.$on('clear', this.clearSelectedLabels);
        }
    }
});
