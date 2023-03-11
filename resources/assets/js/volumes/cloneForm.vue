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
            selectedProjectId: 0,
            cloneFiles: false,
            cloneFileLabels: false,
            restrictFileLabels: false,
            cloneAnnotationLabels: false,
            restrictAnnotationLabels: false,
            filePattern: "",
            selectedFiles: [],
            fileLabelTrees: [],
            annotationLabelTrees: [],
            fileLabelIds: [],
            annotationLabelIds: [],
            cloneUrlTemplate: "",
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
        setDefaultProject() {
            return this.destinationProjects.filter((p) => p.id === this.selectedProjectId)[0].name;
        },
        cannotSubmit() {
            return this.name === '' || this.selectedProjectId < 0 || this.loading;
        },
        getCloneUrl() {
            return this.cloneUrlTemplate.replace(':pid', this.selectedProjectId);
        },
    },
    methods: {
        setProject(project) {
            this.selectedProjectId = project.id;
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
            this.fileLabelIds = labelIds;
        },
        setAnnotationLabels(labelIds) {
            this.annotationLabelIds = labelIds;
        },
        initializeLabelTrees(fileLabelTrees, annotationLabelTrees) {
            const nbrTrees = fileLabelTrees.length;  // labels of fileLabelTrees and annotationLabelTrees are equal

            if (this.fileLabelIds.length > 0) {
                this.cloneFileLabels = true;
                this.restrictFileLabels = true;
            }

            if (this.annotationLabelIds.length > 0) {
                this.cloneAnnotationLabels = true;
                this.restrictAnnotationLabels = true;
            }

            for (let i = 0; i < nbrTrees; i++) {
                fileLabelTrees[i].labels.forEach((label) => this.fileLabelIds.includes(String(label.id)) ?
                    label.selected = true : label.selected = false);
                annotationLabelTrees[i].labels.forEach((label) => this.annotationLabelIds.includes(String(label.id)) ?
                    label.selected = true : label.selected = false);
            }

            this.fileLabelTrees = fileLabelTrees;
            this.annotationLabelTrees = annotationLabelTrees;
        },
        initializeFileList(ids, filenames) {
            const nbrFiles = ids.length;
            if (nbrFiles > 0) {
                this.cloneFiles = true;
                for (let i = 0; i < nbrFiles; i++) {
                    this.selectedFiles.push({id: ids[i], filename: filenames[i]});
                }
            }
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
                this.cloneAnnotationLabels = false;
                this.restrictAnnotationLabels = false;
            }
        },
        cloneFileLabels(newState) {
            if (!newState) {
                this.restrictFileLabels = false;
            }
        },
    },
    created() {
        this.volume = biigle.$require('volume');
        this.id = this.volume.id;
        this.name = biigle.$require('name');
        this.destinationProjects = biigle.$require('destinationProjects');
        this.cloneUrlTemplate = biigle.$require('cloneUrlTemplate');
        this.selectedProjectId = Number(location.href.split('=')[1]);
        this.annotationLabelIds = JSON.parse(biigle.$require('annotationLabelIds'));
        this.fileLabelIds = JSON.parse(biigle.$require('fileLabelIds'));
        let fileLabelTrees = JSON.parse(biigle.$require('fileLabelTrees'));
        let annotationLabelTrees = JSON.parse(biigle.$require('annotationLabelTrees'));
        let ids = JSON.parse(biigle.$require('selectedFilesIds'));
        let filenames = JSON.parse(biigle.$require('selectedFiles'));

        this.initializeLabelTrees(fileLabelTrees, annotationLabelTrees);

        this.initializeFileList(ids, filenames);


    },
    mounted() {
        // Vue disables the autofocus attribute somehow, so set focus manually here.
        this.$refs.nameInput.focus();
    },
};
</script>
