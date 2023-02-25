<script>
import LoaderMixin from '../core/mixins/loader';
import Typeahead from "../core/components/typeahead";
import FileItem from "./components/filePanelItem";
import {handleErrorResponse} from "../core/messages/store";
import VolumeApi from '../volumes/api/volumes'
// import LabelTreeLabel from "../label-trees/components/labelTreeLabel";


// const numberFormatter = new Intl.NumberFormat();

/**
 * View model for the create volume form.
 */
export default {
    mixins: [LoaderMixin],
    components: {
        typeahead: Typeahead,
        fileItem: FileItem
        // labelTreeLabel: LabelTreeLabel,
    },
    data() {
        return {
            name: '',
            volume: {},
            id: -1,
            destinationProjects: [],
            files: [],
            selectedProject: {},
            cloneFiles: false,
            cloneFileLabels: false,
            cloneAnnotations: false,
            cloneAnnotationLabels: false,
            filePattern: "",
            selectedFiles: [],
        };
    },
    computed: {
        getProjects() {
            return this.destinationProjects;
        }
    },
    methods: {
        setProject(project) {
            this.selectedProject = project;
        },
        loadFilesMatchingPattern() {
            this.startLoading();
            VolumeApi.queryFilesWithFilename({id: this.id, pattern: this.filePattern})
                .then((response) => this.getMatchedFiles(response.body), handleErrorResponse)
                .finally(this.finishLoading);
        },
        getMatchedFiles(ids) {
            this.selectedFiles = this.files.filter((file) => {
                return ids.includes(file.id)
            });
        },
    },
    watch: {},
    created() {
        this.volume = JSON.parse(biigle.$require('volume'));
        this.id = this.volume.id;
        this.name = this.volume.name;
        this.destinationProjects = JSON.parse(biigle.$require('destinationProjects'));
        this.files = JSON.parse(biigle.$require('files'));


    },
    mounted() {
        // Vue disables the autofocus attribute somehow, so set focus manually here.
        this.$refs.nameInput.focus();
    },
};
</script>
