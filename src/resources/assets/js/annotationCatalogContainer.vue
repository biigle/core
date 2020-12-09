<script>
import ImageGrid from './components/catalogImageGrid';
import LabelsApi from './api/labels';
import LargoContainer from './mixins/largoContainer';

/**
 * View model for the annotation catalog
 */
export default {
    mixins: [LargoContainer],
    components: {
        catalogImageGrid: ImageGrid,
    },
    data() {
        return {
            labelTrees: [],
        };
    },
    methods: {
        queryAnnotations(label) {
            let imagePromise = LabelsApi.queryImageAnnotations({id: label.id});
            let videoPromise = Vue.Promise.resolve([]);

            return Vue.Promise.all([imagePromise, videoPromise]);
        },
    },
    created() {
        let labelTree = biigle.$require('annotationCatalog.labelTree');
        this.labelTrees = [labelTree];
    },
};
</script>
