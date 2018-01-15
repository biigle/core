/**
 * A component that displays a single label of a label tree.
 *
 * @type {Object}
 */
biigle.$component('labelTrees.components.labelTypeahead', {
    mixins: [biigle.$require('core.components.typeahead')],
    props: {
        template: {
            default: '<span class="label-typeahead-item"><span v-if="item.color" :style="{\'background-color\': \'#\' + item.color}" class="label-color"></span><span v-text="item.name"></span></span>',
        },
    },
});
