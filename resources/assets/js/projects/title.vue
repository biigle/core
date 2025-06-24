<script>
import {Dropdown} from 'uiv';
import EditorMixin from '@/core/mixins/editor.vue';
import LoaderMixin from '@/core/mixins/loader.vue';
import Messages from '@/core/messages/store.js';
import ProjectsApi from '@/core/api/projects.js';
import {handleErrorResponse} from '@/core/messages/store.js';

/**
 * The panel for editing the title information of a project
 */
export default{
    mixins: [
        LoaderMixin,
        EditorMixin,
    ],
    components: {
        dropdown: Dropdown,
    },
    data() {
        return {
            project: null,
            name: null,
            description: null,
            userId: null,
            redirectUrl: null,
            volumes: [],
        };
    },
    computed: {
        hasDescription() {
            return !!this.description.length;
        },
        isChanged() {
            return this.name !== this.project.name || this.description !== this.project.description;
        },
        disabledClass() {
            return this.loading ? 'disabled' : '';
        },
    },
    methods: {
        discardChanges() {
            this.name = this.project.name;
            this.description = this.project.description;
            this.finishEditing();
        },
        leaveProject() {
            let confirmed = confirm(`Do you really want to revoke your membership of project "${this.project.name}"?`);

            if (confirmed) {
                this.startLoading();
                ProjectsApi.removeUser({
                    id: this.project.id,
                    user_id: this.userId,
                })
                .then(this.projectLeft, handleErrorResponse)
                .finally(this.finishLoading);
            }
        },
        projectLeft() {
            Messages.success('You left the project. Redirecting...');
            setTimeout(() => location.href = this.redirectUrl, 2000);
        },
        deleteProject() {
            ProjectsApi.queryVolumes({ id: this.project.id }).then(
                volumes => {
                    this.volumes = volumes.data;
                }
            );
            let inputproject = prompt(`Do you realy want to delete ${this.project.name} ?`);
            if (inputproject.replace(/\s/g, '') == this.project.name) {
                let confirmed = confirm(`Do you really want to delete the project ${this.project.name}?`);

                if (confirmed) {
                    this.startLoading();
                    ProjectsApi.delete({ id: this.project.id })
                        .then(this.projectDeleted, this.maybeForceDeleteProject)
                        .finally(this.finishLoading);
                }

            }
        },
        maybeForceDeleteProject(response) {
            if (response.status === 400) {
                let volNames = [];
                for (let i = 0; i < this.volumes.length; i++) {
                    volNames[i] = this.volumes[i].name;
                }
                let inputVolume = prompt(`Do you realy want to delete ${volNames.toString()}?`);
                if (inputVolume.replace(/\s/g, '') == volNames.toString().replace(/\s/g, '')) {
                    let confirmed = confirm('Deleting this project will delete one or more volumes with all annotations! Do you want to continue?');
                    if (confirmed) {
                        this.startLoading();
                        ProjectsApi.delete({ id: this.project.id }, { force: true })
                            .then(this.projectDeleted, handleErrorResponse)
                            .finally(this.finishLoading);
                    }
                }
            } else {
                handleErrorResponse(response);
            }
        },
        projectDeleted() {
            Messages.success('The project was deleted. Redirecting...');
            setTimeout(() => location.href = this.redirectUrl, 2000);
        },
        saveChanges() {
            this.startLoading();
            ProjectsApi.update({id: this.project.id}, {
                    name: this.name,
                    description: this.description,
                })
                .then(this.changesSaved, handleErrorResponse)
                .finally(this.finishLoading);
        },
        changesSaved() {
            this.project.name = this.name;
            this.project.description = this.description;
            this.finishEditing();
        }
    },
    created() {
        this.project = biigle.$require('projects.project');
        // Duplicate the project properties so they can be changed and possibly
        // discarded without affecting the original project object.
        this.name = this.project.name;
        this.description = this.project.description;
        this.userId = biigle.$require('projects.userId');
        this.redirectUrl = biigle.$require('projects.redirectUrl');
    },
};
</script>
