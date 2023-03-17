<script>
import LoaderMixin from '../core/mixins/loader';
import Typeahead from "../core/components/typeahead";
import FileItem from "./components/filePanelItem";
import {handleErrorResponse} from "../core/messages/store";
import VolumeApi from '../volumes/api/volumes'
import LabelTrees from "../label-trees/components/labelTrees";
import {urlParams as UrlParams} from '../core/utils';

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
            volumeFilenames: [],
            fileLabelTrees: [],
            annotationLabelTrees: [],
            fileLabelIds: [],
            annotationLabelIds: [],
            cloneUrlTemplate: "",
            noFilesFoundByPattern: false
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
        cannotSubmit() {
            return this.name === '' || this.selectedProjectId < 0 || this.loading;
        },
        getCloneUrl() {
            return this.cloneUrlTemplate.replace(':pid', this.selectedProjectId);
        },
    },
    methods: {
        setDefaultProject() {
            return this.destinationProjects.find(p => p.id === this.selectedProjectId).name;
        },
        setProject(project) {
            this.selectedProjectId = project.id;
        },
        async loadFilesMatchingPattern() {
            if (this.filePattern.length === 0) {
                return;
            }
            this.startLoading();
            if (!this.volumeFilenames.length) {
                this.volumeFilenames = await VolumeApi.queryFilenames({id: this.id})
                    .then((response) => {
                        return response.body;
                    }, handleErrorResponse);
            }

            VolumeApi.queryFilesWithFilename({id: this.id, pattern: this.filePattern})
                .then((response) => {
                    let ids = response.body;
                    this.setMatchedFiles(ids.map(id => {
                        return {id: id, filename: this.volumeFilenames[id]}
                    }));
                }, handleErrorResponse)
                .finally(() => {
                    this.finishLoading();
                    if (this.selectedFiles.length === 0) {
                        this.noFilesFoundByPattern = true;
                    }
                });

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
        initializeFileList(ids) {
            const nbrFiles = ids.length;
            if (nbrFiles > 0) {
                VolumeApi.queryFilenames({id: this.id})
                    .then(response => {
                        let filenames = response.body;
                        this.cloneFiles = true;
                        for (let i = 0; i < nbrFiles; i++) {
                            this.selectedFiles.push({id: ids[i], filename: filenames[Number(ids[i])]});
                        }
                    })
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
                this.noFilesFoundByPattern = false;
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
        this.selectedProjectId = Number(UrlParams.get('project'));
        this.annotationLabelIds = biigle.$require('annotationLabelIds');
        this.fileLabelIds = biigle.$require('fileLabelIds');
        this.cloneFileLabels = biigle.$require('cloneFileLabels');
        this.cloneAnnotationLabels = biigle.$require('cloneAnnotations');
        let fileLabelTrees = biigle.$require('fileLabelTrees');
        let annotationLabelTrees = biigle.$require('annotationLabelTrees');
        let ids = biigle.$require('selectedFilesIds');

        this.initializeLabelTrees(fileLabelTrees, annotationLabelTrees);

        this.initializeFileList(ids);


    },
    mounted() {
        // Vue disables the autofocus attribute somehow, so set focus manually here.
        this.$refs.nameInput.focus();
    },
};
</script>
