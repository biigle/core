<script>
import LoaderMixin from '@/core/mixins/loader.vue';
import Typeahead from '@/core/components/typeahead.vue';
import FileItem from './components/filePanelItem.vue';
import {handleErrorResponse} from '@/core/messages/store.js';
import VolumeApi from '@/volumes/api/volumes.js'
import LabelTrees from '@/label-trees/components/labelTrees.vue';
import {urlParams as UrlParams} from '@/core/utils.js';

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
            isImageVolume: true,
            destinationProjects: [],
            selectedProjectId: 0,
            filterFiles: false,
            cloneFileLabels: false,
            filterFileLabels: false,
            cloneAnnotations: false,
            filterAnnotations: false,
            filePattern: "",
            selectedFiles: [],
            volumeFilenames: [],
            fileLabelTrees: [],
            annotationLabelTrees: [],
            fileLabelIds: [],
            annotationLabelIds: [],
            cloneUrlTemplate: "",
            noFilesFoundByPattern: false,
            showTestQueryBtn: false,
            cloneBtnTitle: "",
            disableCloneBtn: false,
        };
    },
    computed: {
        getProjects() {
            return this.destinationProjects;
        },
        selectedFileLabels() {
            return this.flatLabels(this.fileLabelTrees).filter(label => label.selected)
        },
        selectedFileLabelIds() {
            return this.selectedFileLabels.map(label => label.id);
        },
        selectedAnnotationLabels() {
            return this.flatLabels(this.annotationLabelTrees).filter((label) => label.selected);

        },
        selectedAnnotationLabelIds(){
            return this.selectedAnnotationLabels.map((label) => label.id);
        },
        selectedFileLabelsCount() {
            return this.selectedFileLabelIds.length;
        },
        selectedAnnotationLabelsCount() {
            return this.selectedAnnotationLabelIds.length;
        },
        cannotSubmit() {
            return this.name === '' || this.selectedProjectId < 0 || this.loading || this.showTestQueryBtn || this.disableCloneBtn;
        },
        getCloneUrl() {
            return this.cloneUrlTemplate.replace(':pid', this.selectedProjectId);
        },
        selectedProjectName() {
            return this.destinationProjects.find(p => p.id === this.selectedProjectId)?.name || '';
        },
    },
    methods: {
        setProject(project) {
            this.selectedProjectId = project.id;
        },
        async loadFilesMatchingPattern() {
            if (this.filePattern.length === 0) {
                return;
            }

            this.startLoading();
            this.noFilesFoundByPattern = false;
            let promise1 = VolumeApi.queryFilenames({id: this.id});
            let promise2 = VolumeApi.queryFilesWithFilename({
                id: this.id,
                pattern: this.filePattern
            });

            Promise.all([promise1, promise2])
                .then(values => {
                    return values.map(r => r.body);
                })
                .then(values => {
                    let [id2filenames, ids] = values;
                    this.setMatchedFiles(ids.map(id => {
                        return {id: id, filename: id2filenames[id]}
                    }));
                })
                .catch(handleErrorResponse)
                .finally(() => {
                    this.finishLoading();
                    if (this.selectedFiles.length === 0) {
                        this.noFilesFoundByPattern = true;
                    }
                    this.showTestQueryBtn = false;
                    this.disableCloneBtn = this.noFilesFoundByPattern;
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
        initializeLabelTrees(fileLabelTrees, annotationLabelTrees, fileLabelIds, annotationLabelIds) {
            const nbrTrees = fileLabelTrees.length;  // labels of fileLabelTrees and annotationLabelTrees are equal

            for (let i = 0; i < nbrTrees; i++) {
                fileLabelTrees[i].labels.forEach((label) => fileLabelIds.includes(String(label.id)) ?
                    label.selected = true : label.selected = false);
                annotationLabelTrees[i].labels.forEach((label) => annotationLabelIds.includes(String(label.id)) ?
                    label.selected = true : label.selected = false);
            }

            this.fileLabelTrees = fileLabelTrees;
            this.annotationLabelTrees = annotationLabelTrees;
            this.fileLabelIds = fileLabelIds;
            this.annotationLabelIds = annotationLabelIds;

            if (this.fileLabelIds.length > 0) {
                this.cloneFileLabels = true;
                this.filterFileLabels = true;
            }

            if (this.annotationLabelIds.length > 0) {
                this.cloneAnnotations = true;
                this.filterAnnotations = true;
            }
        },
        initializeFileList(ids) {
            const nbrFiles = ids.length;
            if (nbrFiles > 0) {
                VolumeApi.queryFilenames({id: this.id})
                    .then(response => {
                        let filenames = response.body;
                        this.filterFiles = true;
                        for (let i = 0; i < nbrFiles; i++) {
                            this.selectedFiles.push({id: ids[i], filename: filenames[Number(ids[i])]});
                        }
                    })
            }
        },
    },
    watch: {
        cloneAnnotations(newState) {
            if (!newState) {
                this.filterAnnotations = false;
            }
        },
        filterFiles(newState) {
            if (!newState) {
                this.noFilesFoundByPattern = false;
            }
            if (!this.fileFiles) {
                this.showTestQueryBtn = false;
                this.filePattern = "";
                this.selectedFiles = [];
            }
            this.disableCloneBtn = this.filterFiles;
        },
        cloneFileLabels(newState) {
            if (!newState) {
                this.filterFileLabels = false;
            }
        },
        filePattern(newPattern, oldPattern) {
            if (newPattern.length === 0) {
                this.showTestQueryBtn = false;
                return;
            }

            this.showTestQueryBtn = this.filterFiles && (oldPattern !== newPattern);
        },
        cannotSubmit() {
            if (this.cannotSubmit) {
                this.cloneBtnTitle = "The file filter query has to be tested first before the volume can be cloned.";
            } else {
                this.cloneBtnTitle = "";
            }
        },
        noFilesFoundByPattern() {
            if (this.cannotSubmit && this.noFilesFoundByPattern) {
                this.cloneBtnTitle = "The cloned volume would be empty based on the current file filter query.";
            }
        }
    },
    created() {
        this.volume = biigle.$require('volume');
        this.id = this.volume.id;
        this.name = biigle.$require('name');
        this.isImageVolume = biigle.$require('isImageVolume');
        this.destinationProjects = biigle.$require('destinationProjects');
        this.cloneUrlTemplate = biigle.$require('cloneUrlTemplate');
        this.selectedProjectId = Number(UrlParams.get('project'));
        this.cloneFileLabels = biigle.$require('cloneFileLabels');
        this.cloneAnnotations = biigle.$require('cloneAnnotations');
        let fileLabelTrees = biigle.$require('fileLabelTrees');
        let annotationLabelTrees = biigle.$require('annotationLabelTrees');
        let ids = biigle.$require('selectedFilesIds');
        let annotationLabelIds = biigle.$require('annotationLabelIds');
        let fileLabelIds = biigle.$require('fileLabelIds');

        this.initializeLabelTrees(fileLabelTrees, annotationLabelTrees,fileLabelIds,annotationLabelIds);

        this.initializeFileList(ids);


    },
    mounted() {
        // Vue disables the autofocus attribute somehow, so set focus manually here.
        this.$refs.nameInput.focus();
    },
};
</script>
