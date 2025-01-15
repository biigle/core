<script>
import LargoContainer from './mixins/largoContainer';
import ProjectsApi from './api/projects';
import {IMAGE_ANNOTATION} from './constants';
import {handleErrorResponse} from './import';

/**
 * View model for the main Largo container (for projects)
 */
export default {
    mixins: [LargoContainer],
    data() {
        return {
            projectId: null,
            labelTrees: [],
            annotationLabels: {},
        };
    },
    methods: {
        queryAnnotations(label) {
            let imagePromise = ProjectsApi.queryImageAnnotations({id: this.projectId, label_id: label.id});
            let videoPromise = ProjectsApi.queryVideoAnnotations({id: this.projectId, label_id: label.id});

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
        fetchAllAnnotations() {
            let emptyResponse = { body: [] };
            this.startLoading();
            Promise.all([
                ProjectsApi.getAllProjectsImageAnnotationLabels({ id: this.projectId })
                    .then((res) => { return this.parseResponse([res, emptyResponse]) }),
                ProjectsApi.getAllProjectsVideoAnnotationLabels({ id: this.projectId })
                    .then((res) => { return this.parseResponse([emptyResponse, res]) }),
            ])
                .then(this.mergeLabels)
                .catch(handleErrorResponse)
                .finally(this.finishLoading);
        },
        parseResponse(responses) {
            let res = responses[0].body.length > 0 ? responses[0] : responses[1];
            this.fetchedAllAnnotations = true;
            return res.body.reduce((labelsObj, l) => {
                let tIdx = this.labelTreesIndex[l.label_tree_id].index;
                let lIdx = this.labelTreesIndex[l.label_tree_id].labels[l.id];
                let label = this.labelTrees[tIdx].labels[lIdx];
                if (label.hasOwnProperty('count')) {
                    label.count += l.count;
                } else {
                    label.count = l.count;
                    labelsObj[label.id] = label;
                }
                return labelsObj;
            }, {});
        },
        mergeLabels(responses) {
            this.annotationLabels = { ...responses[0], ...responses[1] };
        }
    },
    created() {
        this.projectId = biigle.$require('largo.projectId');
        this.labelTrees = biigle.$require('largo.labelTrees');
    },
};
</script>
