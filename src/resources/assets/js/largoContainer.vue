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
        queryAnnotations(label) {
            let imagePromise;
            let videoPromise;
            if (this.mediaType === 'image') {
                imagePromise = VolumesApi.queryImageAnnotations({id: this.volumeId, label_id: label.id});
                videoPromise = Vue.Promise.resolve([]);
            } else {
                imagePromise = Vue.Promise.resolve([]);
                videoPromise = VolumesApi.queryVideoAnnotations({id: this.volumeId, label_id: label.id});
            }

            return Vue.Promise.all([imagePromise, videoPromise]);
        },
        performSave(payload) {
            return VolumesApi.save({id: this.volumeId}, payload);
        },
        querySortByOutlier(labelId) {
            return VolumesApi.sortAnnotationsByOutlier({id: this.volumeId, label_id: labelId});
        },
    },
    created() {
        this.volumeId = biigle.$require('largo.volumeId');
        this.labelTrees = biigle.$require('largo.labelTrees');
        this.mediaType = biigle.$require('largo.mediaType');
    },
};
</script>
