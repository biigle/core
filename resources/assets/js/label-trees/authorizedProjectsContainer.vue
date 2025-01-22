<script>
import LabelTreesApi from '@/core/api/labelTree.js';
import LoaderMixin from '@/core/mixins/loader.vue';
import ProjectsApi from '@/core/api/projects.js';
import Typeahead from '@/core/components/typeahead.vue';
import {handleErrorResponse} from '@/core/messages/store.js';

/**
 * The panel for editing the authorized projects of a label tree
 */
export default {
    mixins: [
        LoaderMixin,
    ],
    data() {
        return {
            labelTree: null,
            ownProjects: [],
            authorizedProjects: [],
            authorizedOwnProjects: [],
            privateId: null,
        };
    },
    components: {
        typeahead: Typeahead,
    },
    computed: {
        isPrivate() {
            return this.labelTree.visibility_id === this.privateId;
        },
        authorizableProjects() {
            return this.ownProjects.filter((project) => {
                for (let i = this.authorizedProjects.length - 1; i >= 0; i--) {
                    if (this.authorizedProjects[i].id === project.id) {
                        return false;
                    }
                }

                return true;
            });
        },
        hasAuthorizedProjects() {
            return this.authorizedProjects.length > 0;
        },
    },
    methods: {
        fetchOwnProjects() {
            ProjectsApi.query().then((response) => {
                this.ownProjects = response.body;
            }, handleErrorResponse);
        },
        addAuthorizedProject(project) {
            if (project && !this.loading) {
                this.startLoading();
                LabelTreesApi.addAuthorizedProject({id: this.labelTree.id}, {id: project.id})
                    .then(() => this.authorizedProjectAdded(project), handleErrorResponse)
                    .finally(this.finishLoading);
            }
        },
        authorizedProjectAdded(project) {
            this.authorizedProjects.push(project);
            // user can only authorize own projects
            this.authorizedOwnProjects.push(project.id);
        },
        removeAuthorizedProject(project) {
            this.startLoading();
            LabelTreesApi.removeAuthorizedProject({id: this.labelTree.id, project_id: project.id})
                .then(() => this.authorizedProjectRemoved(project), handleErrorResponse)
                .finally(this.finishLoading);
        },
        authorizedProjectRemoved(project) {
            let i;
            for (i = this.authorizedProjects.length - 1; i >= 0; i--) {
                if (this.authorizedProjects[i].id === project.id) {
                    this.authorizedProjects.splice(i, 1);
                }
            }

            i = this.authorizedOwnProjects.indexOf(project.id);
            if (i !== -1) {
                this.authorizedOwnProjects.splice(i, 1);
            }
        },
        isOwnProject(project) {
            return this.authorizedOwnProjects.indexOf(project.id) !== -1;
        },
    },
    created() {
        this.privateId = biigle.$require('labelTrees.privateVisibilityId');
        this.labelTree = biigle.$require('labelTrees.labelTree');
        this.authorizedProjects = biigle.$require('labelTrees.authorizedProjects');
        this.authorizedOwnProjects = biigle.$require('labelTrees.authorizedOwnProjects');
        this.fetchOwnProjects();
    },
};
</script>
