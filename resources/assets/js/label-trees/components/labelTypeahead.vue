<script>
import Typeahead from '../../core/components/typeahead';

/**
 * A component that displays a single label of a label tree.
 *
 * @type {Object}
 */
export default {
    mixins: [Typeahead],
    props: {
        template: {
            default: `<span class="label-typeahead-item"><span v-if="item.color" :style="{'background-color': '#' + item.color}" class="label-color"></span><span v-text="item.name"></span></span>`,
        },
    },
};
</script>
