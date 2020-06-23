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
    data: {
        labelTrees: [],
    },
    methods: {
        queryAnnotations(label) {
            return LabelsApi.queryAnnotations({id: label.id});
        },
    },
    created() {
        let labelTree = biigle.$require('annotationCatalog.labelTree');
        this.labelTrees = [labelTree];
    },
};
