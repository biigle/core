<script>
import LargoContainer from './mixins/largoContainer';
import ProjectsApi from './api/projects';
import {IMAGE_ANNOTATION} from './constants';
import ShapesApi from './api/shapes';

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
        queryAnnotations(label, filters) {
            let imagePromise = ProjectsApi.queryImageAnnotations({
                id: this.projectId,
                label_id: label.id,
                ...filters,
            });
            let videoPromise = ProjectsApi.queryVideoAnnotations({
                id: this.projectId,
                label_id: label.id,
                ...filters,
            });
            return Vue.Promise.all([imagePromise, videoPromise]);
        },
        getSelectedAnnotationName(label, filters) {
            return JSON.stringify({
                ...filters,
                label: label.id,
            });
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
        getShapes() {
            let annotationShapeTypes = ShapesApi.getAllShapes().then(
                (response) => response.json()
            )
            return annotationShapeTypes
        },
    },
    created() {
        this.projectId = biigle.$require('largo.projectId');
        this.labelTrees = biigle.$require('largo.labelTrees');
    },
};
</script>
