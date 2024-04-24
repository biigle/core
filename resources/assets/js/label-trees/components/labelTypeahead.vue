<script>
import LabelTypeaheadItem from './labelTypeaheadItem';
import Typeahead from '../../core/components/typeahead';

/**
 * A component that displays a single label of a label tree.
 *
 * @type {Object}
 */
export default {
    mixins: [Typeahead],
    props: {
        itemComponent: {
            type: Object,
            default: () => LabelTypeaheadItem,
        },
    },
};
</script>
