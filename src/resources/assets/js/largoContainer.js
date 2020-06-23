import LargoContainer from './mixins/largoContainer';
import VolumesApi from './api/volumes';

/**
 * View model for the main Largo container
 */
export default {
    mixins: [LargoContainer],
    data: {
        volumeId: null,
        labelTrees: [],
    },
    methods: {
        queryAnnotations(label) {
            return VolumesApi.queryAnnotations({id: this.volumeId, label_id: label.id});
        },
        performSave(payload) {
            return VolumesApi.save({id: this.volumeId}, payload);
        },
    },
    created() {
        this.volumeId = biigle.$require('largo.volumeId');
        this.labelTrees = biigle.$require('largo.labelTrees');
    },
};
