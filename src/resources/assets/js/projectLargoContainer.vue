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
                    .then((res) => { return this.parseAnnotationDataResponse([res, emptyResponse]) }),
                ProjectsApi.getAllProjectsVideoAnnotationLabels({ id: this.projectId })
                    .then((res) => { return this.parseAnnotationDataResponse([emptyResponse, res]) }),
            ])
                .then(this.addAnnotationsToCache)
                .catch(handleErrorResponse)
                .finally(this.finishLoading);
        },
        addAnnotationsToCache(responses) {
            let lids = new Set(responses.map((res) => Object.keys(res)).flat());
            lids.forEach(id => {
                let annotations = [];
                if (responses[0].hasOwnProperty(id) && responses[1].hasOwnProperty(id)) {
                    annotations = responses[0][id].concat(responses[1][id]);
                } else if (responses[0].hasOwnProperty(id)) {
                    annotations = responses[0][id];
                } else {
                    annotations = responses[1][id];
                }
                // Show the newest annotations (with highest ID) first.
                annotations = annotations.sort((a, b) => b.id - a.id);
                Vue.set(this.annotationsCache, id, annotations);
            })

            this.fetchedAllAnnotations = true;
        }
    },
    created() {        
        this.projectId = biigle.$require('largo.projectId');
        this.labelTrees = biigle.$require('largo.labelTrees');
    },
};
</script>
