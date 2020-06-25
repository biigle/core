import {LoaderMixin} from '../import';
import EntityChooser from '../components/entityChooser';

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
