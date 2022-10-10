<script>
import EditorMixin from '../core/mixins/editor';
import FileItem from './components/filePanelItem';
import ImagesApi from '../core/api/images';
import VideosApi from '../videos/api/videos';
import LoaderMixin from '../core/mixins/loader';
import VolumesApi from './api/volumes';
import {handleErrorResponse} from '../core/messages/store';

/**
 * The panel for editing volume images
 */

export default {
    mixins: [
        LoaderMixin,
        EditorMixin,
    ],
    data() {
        return {
            volumeId: null,
            filenames: '',
            files: [],
            errors: {},
            type: '',
        };
    },
    components: {
        fileItem: FileItem,
    },
    computed: {
        classObject() {
            return {
                'panel-warning panel--editing': this.editing,
            };
        },
        orderedFiles() {
            return this.files.slice().sort(function (a, b) {
                return a.filename.localeCompare(b.filename, undefined, {
                    numeric: true,
                    sensitivity: 'base',
                });
            });
        },
        hasNoFiles() {
            return !this.loading && this.files.length === 0;
        },
        fileApi() {
            return this.type === 'image' ? ImagesApi : VideosApi;
        },
    },
    methods: {
        submit() {
            if (this.loading) return;

            this.startLoading();
            VolumesApi.saveFiles({id: this.volumeId}, {files: this.filenames})
                .then(this.filesSaved)
                .catch(this.handleErrorResponse)
                .finally(this.finishLoading);
        },
        filesSaved(response) {
            for (let i = response.data.length - 1; i >= 0; i--) {
                response.data[i].isNew = true;
                this.files.push(response.data[i]);
            }
            this.filenames = '';
        },
        handleRemove(file) {
            if (!this.loading && confirm(`Are you sure that you want to delete the ${this.type} #${file.id} (${file.filename})?`)) {
                this.startLoading();
                this.fileApi.delete({id: file.id})
                    .then(() => this.fileRemoved(file.id))
                    .catch((response) => {
                        if (response.status === 422) {
                            if (confirm(`The ${this.type} contains annotations. Proceed to delete the ${this.type}?`)) {
                                return this.fileApi.delete({id: file.id}, {force: true})
                                    .then(() => this.fileRemoved(file.id));
                            }
                        } else {
                            throw response;
                        }
                    })
                    .catch(handleErrorResponse)
                    .finally(this.finishLoading);
            }
        },
        fileRemoved(id) {
            let files = this.files;
            for (let i = files.length - 1; i >= 0; i--) {
                if (files[i].id === id) {
                    files.splice(i, 1);
                    return;
                }
            }
        },
        handleErrorResponse(response) {
            if (response.status === 422) {
                this.errors = response.data.errors;
            } else {
                handleErrorResponse(response);
            }
        },
        hasError(name) {
            return this.errors.hasOwnProperty(name);
        },
        getError(name) {
            return this.errors[name].join("\n");
        },
        setFiles(response) {
            for (let id in response.body) {
                if (!response.body.hasOwnProperty(id));
                this.files.push({id: id, filename: response.body[id]});
            }
        },
    },
    watch: {
        loading(loading) {
            if (loading) {
                this.errors = {};
            }
        },
    },
    created() {
        this.volumeId = biigle.$require('volumes.id');
        this.type = biigle.$require('volumes.type');

        this.startLoading();
        VolumesApi.queryFilenames({id: this.volumeId})
            .then(this.setFiles, handleErrorResponse)
            .finally(this.finishLoading);
    },
};
</script>
