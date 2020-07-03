<script>
import EntityChooser from '../components/entityChooser';
import {LoaderMixin} from '../import';

/**
 * A mixin for the import view models
 *
 * @type {Object}
 */
export default {
    mixins: [LoaderMixin],
    components: {
        entityChooser: EntityChooser,
    },
    data() {
        return {
            success: false,
        };
    },
    methods: {
        importSuccess() {
            this.success = true;
        },
    },
};
</script>
