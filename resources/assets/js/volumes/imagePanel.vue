<script>
import EditorMixin from '../core/mixins/editor';
import ImageItem from './components/imagePanelItem';
import ImagesApi from '../core/api/images';
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
            images: [],
            errors: {},
        };
    },
    components: {
        imageItem: ImageItem,
    },
    computed: {
        classObject() {
            return {
                'panel-warning panel--editing': this.editing,
            };
        },
        orderedImages() {
            return this.images.slice().sort((a, b) => a.filename < b.filename ? -1 : 1);
        },
        hasNoImages() {
            return !this.loading && this.images.length === 0;
        },
    },
    methods: {
        submit() {
            if (this.loading) return;

            this.startLoading();
            VolumesApi.saveFiles({id: this.volumeId}, {images: this.filenames})
                .then(this.imagesSaved)
                .catch(this.handleErrorResponse)
                .finally(this.finishLoading);
        },
        imagesSaved(response) {
            for (let i = response.data.length - 1; i >= 0; i--) {
                response.data[i].isNew = true;
                this.images.push(response.data[i]);
            }
            this.filenames = '';
        },
        handleRemove(image) {
            if (!this.loading && confirm(`Do you really want to delete the image #${image.id} (${image.filename})? All annotations will be lost!`)) {
                this.startLoading();
                ImagesApi.delete({id: image.id})
                    .then(() => this.imageRemoved(image.id))
                    .catch(handleErrorResponse)
                    .finally(this.finishLoading);
            }
        },
        imageRemoved(id) {
            let images = this.images;
            for (let i = images.length - 1; i >= 0; i--) {
                if (images[i].id === id) {
                    images.splice(i, 1);
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
        setImages(response) {
            for (let id in response.body) {
                if (!response.body.hasOwnProperty(id));
                this.images.push({id: id, filename: response.body[id]});
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

        this.startLoading();
        VolumesApi.queryFilenames({id: this.volumeId})
            .then(this.setImages, handleErrorResponse)
            .finally(this.finishLoading);
    },
};
</script>
