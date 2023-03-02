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
            restrictFileLabels: false,
            cloneAnnotations: false,
            restrictAnnotationLabels: false,
            filePattern: "",
            selectedFiles: [],
            fileLabelTrees: [],
            annotationLabelTrees: [],
            fileLabels: [],
            annotationLabels: []
        };
    },
    computed: {
        getProjects() {
            return this.destinationProjects;
        },
        selectedFileLabels() {
            let selection = this.flatLabels(this.fileLabelTrees).filter((label) => label.selected);
            this.setFileLabels(selection.map((label) => label.id));
            return selection;
        },
        selectedAnnotationLabels() {
            let selection = this.flatLabels(this.annotationLabelTrees).filter((label) => label.selected);
            this.setAnnotationLabels(selection.map((label) => label.id))
            return selection;
        },
        selectedFileLabelsCount() {
            return this.selectedFileLabels.length;
        },
        selectedAnnotationLabelsCount() {
            return this.selectedAnnotationLabels.length;
        },
    },
    methods: {
        setProject(project) {
            this.selectedProject = project;
        },
        async loadFilesMatchingPattern() {
            if (this.filePattern.length > 0) {
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
            }
        },
        setMatchedFiles(filenames) {
            this.selectedFiles = filenames;
        },
        flatLabels(trees) {
            let labels = [];
            trees.forEach(function (tree) {
                Array.prototype.push.apply(labels, tree.labels);
            });

            return labels;
        },
        setFileLabels(labelIds) {
            this.fileLabels = labelIds;
        },
        setAnnotationLabels(labelIds) {
            this.annotationLabels = labelIds;
        }
    },
    watch: {
        cloneAnnotations(newState) {
            if (!newState) {
                this.restrictAnnotationLabels = false;
            }
        },
        cloneFiles(newState) {
            if (!newState) {
                this.restrictFileLabels = false;
                this.cloneAnnotations = false;
                this.restrictAnnotationLabels = false;
            }
        },
        cloneFileLabels(newState) {
            if (!newState) {
                this.restrictFileLabels = false;
            }
        }
    },
    created() {
        this.volume = JSON.parse(biigle.$require('volume'));
        this.id = this.volume.id;
        this.name = this.volume.name;
        this.destinationProjects = JSON.parse(biigle.$require('destinationProjects'));
        let fileLabelTrees = JSON.parse(biigle.$require('labelTrees'));
        let annotationLabelTrees = JSON.parse(biigle.$require('labelTrees'));
        let nbrTrees = fileLabelTrees.length;

        for (let i = 0; i < nbrTrees; i++) {
            fileLabelTrees[i].labels.forEach((label) => label.selected = false);
            annotationLabelTrees[i].labels.forEach((label) => label.selected = false);
        }

        this.fileLabelTrees = fileLabelTrees;
        this.annotationLabelTrees = annotationLabelTrees;


    },
    mounted() {
        // Vue disables the autofocus attribute somehow, so set focus manually here.
        this.$refs.nameInput.focus();
    },
};
</script>
