<script>
import LoaderMixin from '../core/mixins/loader';
import Typeahead from "../core/components/typeahead";
import FileItem from "./components/filePanelItem";
import {handleErrorResponse} from "../core/messages/store";
import VolumeApi from '../volumes/api/volumes'
import LabelTrees from "../label-trees/components/labelTrees";


// const numberFormatter = new Intl.NumberFormat();

/**
 * View model for the create volume form.
 */
export default {
    mixins: [LoaderMixin],
    components: {
        typeahead: Typeahead,
        fileItem: FileItem,
        LabelTrees,
    },
    data() {
        return {
            name: "",
            volume: {},
            id: 0,
            destinationProjects: [],
            selectedProject: {},
            cloneFiles: false,
            cloneFileLabels: false,
            cloneAnnotations: false,
            cloneAnnotationLabels: false,
            filePattern: "",
            selectedFiles: [],
            labelTrees: [],
            labels: []
        };
    },
    computed: {
        getProjects() {
            return this.destinationProjects;
        },
    },
    methods: {
        setProject(project) {
            this.selectedProject = project;
        },
        async loadFilesMatchingPattern() {
            this.startLoading();
            let id2filenames = await VolumeApi.queryFilenames({id: this.id})
                .then((response) => {
                    return response.body;
                }, handleErrorResponse);
            VolumeApi.queryFilesWithFilename({id: this.id, pattern: this.filePattern})
                .then((response2) => {
                    let ids = response2.body;
                    this.setMatchedFiles(ids.map(id => {
                        return {id: id, filename: id2filenames[id]}
                    }));
                }, handleErrorResponse)
                .finally(this.finishLoading);
        },
        setMatchedFiles(filenames) {
            this.selectedFiles = filenames;
        },
    },
    watch: {
        cloneAnnotations(newState) {
            if (!newState) {
                this.cloneAnnotationLabels = false;
            }
        },
    },
    created() {
        this.volume = JSON.parse(biigle.$require('volume'));
        this.id = this.volume.id;
        this.name = this.volume.name;
        this.destinationProjects = JSON.parse(biigle.$require('destinationProjects'));
        this.labelTrees = JSON.parse(biigle.$require('labelTrees'));


    },
    mounted() {
        // Vue disables the autofocus attribute somehow, so set focus manually here.
        this.$refs.nameInput.focus();
    },
};
</script>
