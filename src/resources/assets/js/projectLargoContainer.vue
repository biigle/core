<script>
import LargoContainer from './mixins/largoContainer';
import ProjectsApi from './api/projects';
import {IMAGE_ANNOTATION} from './constants';

/**
 * View model for the main Largo container (for projects)
 */
export default {
    mixins: [LargoContainer],
    data() {
        return {
            projectId: null,
            labelTrees: [],
        };
    },
    methods: {
        queryAnnotations(label, filters = []) {

            let params = { ...filters, id: this.projectId, label_id: label.id };

            let imagePromise = ProjectsApi.queryImageAnnotations(params);
            let videoPromise = ProjectsApi.queryVideoAnnotations(params);
            return Vue.Promise.all([imagePromise, videoPromise]);
        },
        performSave(payload) {
            return ProjectsApi.save({id: this.projectId}, payload);
        },
        querySortByOutlier(labelId) {
            return ProjectsApi.sortAnnotationsByOutlier({id: this.projectId, label_id: labelId});
        },
        querySortBySimilarity(labelId, reference) {
            let params = {
                id: this.projectId,
                label_id: labelId,
            };

            if (reference.type === IMAGE_ANNOTATION) {
                params.image_annotation_id = reference.id;
            } else {
                params.video_annotation_id = reference.id;
            }

            return ProjectsApi.sortAnnotationsBySimilarity(params);
        },
        fetchLabelCount() {
            return ProjectsApi.fetchProjectAnnotationLabelCount({ id: this.projectId });
        },
    },
    created() {
        this.projectId = biigle.$require('largo.projectId');
        this.labelTrees = biigle.$require('largo.labelTrees');
    },
};
</script>
