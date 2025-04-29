<script>
import EntityChooser from '../components/entityChooser.vue';
import LoaderMixin from '@/core/mixins/loader.vue';

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
