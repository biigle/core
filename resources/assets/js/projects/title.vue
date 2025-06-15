<script>
import {Dropdown} from 'uiv';
import EditorMixin from '@/core/mixins/editor.vue';
import LoaderMixin from '@/core/mixins/loader.vue';
import Messages from '@/core/messages/store.js';
import ProjectsApi from '@/core/api/projects.js';
import {handleErrorResponse} from '@/core/messages/store.js';
import Modal from './components/deleteConfirmationModal.vue';

/**
 * The panel for editing the title information of a project
 */
export default{
    mixins: [
        LoaderMixin,
        EditorMixin,
    ],
    components: {
        Dropdown,
        Modal,
        
    },
    data() {
        return {
            project: null,
            name: null,
            description: null,
            userId: null,
            redirectUrl: null,
            userProject: [],
            showModal: false, // TODO RENAME
          //  showModalToConfirm: false,
            inputValue: '',
            
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
        showMessageDeleteProject(){
            console.log('Show modal triggered');
            
           // this.openModal();
           // this.showModalToConfirm = true;
            
            this.showModal = true;
            
            this.startLoading();
           //let confirmed = false;
            //let confirmed = confirm(`Do you really want to delete the project ${this.project.name}?`);
            // Show Projects
            
           /* ProjectsApi.query().then((response) => {
                this.userProject = response.body;
                //console.log(this.userProject, "and", this.showModal);
                this.showModal = true;
                for (let i = 0; i < this.userProject.length; i++){
                    console.log(this.userProject[i].name);
                }
                this.startLoading();
            }); 
            console.log("WANT TO DELETE:", this.inputValue);  */
          // this.deleteProject(confirmed)
        },
        deleteProject(confirmed) {


            // let confirmed = confirm(`Do you really want to delete the project ${this.project.name}?`);

           // if (confirmed) {
           //     this.startLoading();
            //    console.log("Confirmed: ", confirmed);
                ;
               // ProjectsApi.delete({id: this.project.id})
               //     .then(this.projectDeleted, this.maybeForceDeleteProject)
               //     .finally(this.finishLoading);
            //}
        },
        maybeForceDeleteProject(response) {
            if (response.status === 400) {
                let confirmed = confirm('Deleting this project will delete one or more volumes with all annotations! Do you want to continue?');
                if (confirmed) {
                    this.startLoading();
                    ProjectsApi.delete({id: this.project.id}, {force: true})
                        .then(this.projectDeleted, handleErrorResponse)
                        .finally(this.finishLoading);
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
        },
        openModal() {
          //  console.log("OpenModal");
            
      this.showModal = true;
      his.startLoading();
    },
    handleConfirm(value) {
        console.log('Confirmed with input:', value);
        this.showModal = false;
        //alert(`Confirmed with input: ${value}`); // Show input value in alert
    },
        handleConfirmInput() {
            console.log("Confirm is activated",this.inputValue);
            
            this.showModal = false;
            this.startLoading();
            console.log("Inputvalue after confirm: ", this.inputValue);
            this.$emit('confirm');
            //alert(`Confirmed with input: ${inputValue}`); // Show input value in alert
        },
        confirm() {
        console.log("Confirm",this.inputValue); // Log the input value to the console
        this.$emit('confirm', this.inputValue); // Emit the input value on confirm
      },

        //confirm() {
     // console.log(this.inputValue); // Log the input value to the console
      //this.$emit('confirm', this.inputValue); // Emit the input value on confirm
    //},
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
