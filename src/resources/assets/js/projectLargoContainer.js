import LargoContainer from './mixins/largoContainer';
import ProjectsApi from './api/projects';

/**
 * View model for the main Largo container (for projects)
 */
export default{
    mixins: [LargoContainer],
    data: {
        projectId: null,
        labelTrees: [],
    },
    methods: {
        queryAnnotations(label) {
            return ProjectsApi.queryAnnotations({id: this.projectId, label_id: label.id});
        },
        performSave(payload) {
            return ProjectsApi.save({id: this.projectId}, payload);
        },
    },
    created() {
        this.projectId = biigle.$require('largo.projectId');
        this.labelTrees = biigle.$require('largo.labelTrees');
    },
};
