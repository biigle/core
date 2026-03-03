<script>
import ProjectStrategy from './components/projectStrategy.vue';
import LoaderMixin from '@/core/mixins/loader.vue';

export default {
    mixins: [LoaderMixin],
    components: {
        projectStrategy: ProjectStrategy,
    },
};

</script>
