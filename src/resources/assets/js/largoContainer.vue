<script>
import LargoContainer from './mixins/largoContainer';
import VolumesApi from './api/volumes';

/**
 * View model for the main Largo container
 */
export default {
    mixins: [LargoContainer],
    data() {
        return {
            volumeId: null,
            labelTrees: [],
            mediaType: '',
        };
    },
    methods: {
        queryAnnotations(label, filters) {
            let imagePromise;
            let videoPromise;
            let params = { ...filters, id: this.volumeId, label_id: label.id };
            if (this.mediaType === "image") {
                imagePromise = VolumesApi.queryImageAnnotations(params);
                videoPromise = Vue.Promise.resolve([]);
            } else {
                imagePromise = Vue.Promise.resolve([]);
                videoPromise = VolumesApi.queryVideoAnnotations(params);
            }

            return Vue.Promise.all([imagePromise, videoPromise]);
        },
        performSave(payload) {
            return VolumesApi.save({id: this.volumeId}, payload);
        },
        querySortByOutlier(labelId) {
            return VolumesApi.sortAnnotationsByOutlier({id: this.volumeId, label_id: labelId})
                .then(this.parseSortingQuery);
        },
        querySortBySimilarity(labelId, reference) {
            return VolumesApi.sortAnnotationsBySimilarity({id: this.volumeId, label_id: labelId, annotation_id: reference.id})
                .then(this.parseSortingQuery);
        },
        parseSortingQuery(response) {
            // The sorting expects annotation IDs prefixed with 'i' or 'v' so it
            // can work with mixed image and video annotations.
            if (this.mediaType === 'image') {
                response.body = response.body.map(id => 'i' + id);
            } else {
                response.body = response.body.map(id => 'v' + id);
            }

            return response;
        },
        fetchLabelCount() {
            return VolumesApi.fetchVolumeAnnotationLabelCount({ id: this.volumeId });
        }
    },

    created() {
        this.volumeId = biigle.$require('largo.volumeId');
        this.labelTrees = biigle.$require('largo.labelTrees');
        this.mediaType = biigle.$require('largo.mediaType');
    },
};
</script>
