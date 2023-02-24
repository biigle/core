<script>
import LoaderMixin from '../core/mixins/loader';
import Typeahead from "../core/components/typeahead";


// const numberFormatter = new Intl.NumberFormat();

/**
 * View model for the create volume form.
 */
export default {
    mixins: [LoaderMixin],
    components: {
        typeahead: Typeahead,
    },
    data() {
        return {
            name: '',
            destinationProjects: [],
            files: [],
            selectedProject: {},
            filePattern: "",
            selectedFiles: []
        };
    },
    computed: {
        getProjects(){
            return this.destinationProjects;
        }
    },
    methods: {
        setProject(project) {
             this.selectedProject = project;
        },
        getMatchingFiles() {
            // eslint-disable-next-line no-console
            console.log(this.filePattern)
            // eslint-disable-next-line no-undef
            // axios.get("https://biigle.de//api/v1/volumes/:id/files/filter/filename/:pattern")
        }
    },
    watch: {},
    created() {
        this.name = biigle.$require('name');
        this.destinationProjects = JSON.parse(biigle.$require('destinationProjects'));
        // this.destinationProjects = biigle.$require('$destinationProjects');


    },
    mounted() {
        // Vue disables the autofocus attribute somehow, so set focus manually here.
        this.$refs.nameInput.focus();
    },
};
</script>
