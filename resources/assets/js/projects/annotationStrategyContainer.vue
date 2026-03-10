<script>
import AnnotationStrategy from './components/annotationStrategy.vue';

export default {
    components: {
        annotationStrategy: AnnotationStrategy,
    },
    method: {
        sharedMethod() {
            console.log("YAYYY");
        }

    }
};

</script>
