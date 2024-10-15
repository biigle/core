<template>
    <div class="image-grid__image image-grid__image--volume" :class="classObject" :title="title">
        <a v-if="!selectable && image.annotateUrl" :href="image.annotateUrl" :title="linkTitle" class="image-link">
            <preview-thumbnail :id="image.id" :thumb-uris="image.thumbnailUrl">
                <img :src="srcUrl" @error="showEmptyImage">
            </preview-thumbnail>
        </a>
        <preview-thumbnail v-else :id="image.id" :thumb-uris="image.thumbnailUrl" @click="handleClick">
            <img :src="srcUrl" @error="showEmptyImage">
        </preview-thumbnail>
        <span v-if="showFilename" class="image-filename" :title="image.filename" v-text="image.filename"></span>
        <div class="image-buttons">
            <a v-if="image.infoUrl" :href="image.infoUrl" class="image-button" title="View image information">
                <span class="fa fa-info-circle fa-fw" aria-hidden="true"></span>
            </a>
        </div>
        <div v-if="showLabels" class="image-labels" @wheel.stop>
            <file-label-list :file-labels="image.labels" :user-id="userId" :is-admin="isAdmin" :type="type" @deleted="removeImageLabel"></file-label-list>
        </div>
    </div>
</template>

<script>
import Image from './imageGridImage.vue';
import ImageLabelsApi from '../api/imageLabels.js';
import VideoLabelsApi from '../api/videoLabels.js';
import LabelList from './fileLabelList.vue';
import LoaderMixin from '@/core/mixins/loader.vue';
import PreviewThumbnail from '../../projects/components/previewThumbnail.vue';
import {handleErrorResponse} from '@/core/messages/store.vue';

/**
 * A variant of the image grid image used to display volume images
 *
 * @type {Object}
 */
export default {
    mixins: [
        Image,
        LoaderMixin,
    ],
    components: {
        fileLabelList: LabelList,
        previewThumbnail: PreviewThumbnail,
    },
    data() {
        return {
            userId: null,
            isAdmin: false,
            attachingSuccess: null,
            timeout: null,
            saving: false,
            showAnnotationRoute: null,
        };
    },
    props: {
        selectedLabel: {
            type: Object,
            default: null,
        },
        showFilename: {
            type: Boolean,
            default: false,
        },
        showLabels: {
            type: Boolean,
            default: false,
        },
        type: {
            type: String,
            default: 'image',
        },
    },
    computed: {
        alreadyHasSelectedLabel() {
            let selected = this.selectedLabel;

            return this.image.labels.reduce(function (carry, item) {
                return carry || selected.id === item.label_id;
            }, false);
        },
        showAnnotationLink() {
            return this.showAnnotationRoute ? (this.showAnnotationRoute + this.image.id) : '';
        },
        selected() {
            return this.image.flagged;
        },
        canBeSelected() {
            return this.selectable && this.selectedLabel && !this.alreadyHasSelectedLabel && !this.saving;
        },
        classObject() {
            return {
                'image-grid__image--selected': this.selected,
                'image-grid__image--selectable': this.canBeSelected,
                'image-grid__image--saving': this.selectable && this.saving,
                'image-grid__image--success': this.attachingSuccess === true,
                'image-grid__image--error': this.attachingSuccess === false,
            };
        },
        title() {
            return this.canBeSelected ? 'Attach ' + this.selectedLabel.name : '';
        },
        linkTitle() {
            return `Annotate this ${this.type}`;
        },
    },
    methods: {
        handleClick() {
            if (!this.canBeSelected) {
                return;
            }

            this.saving = true;
            let promise;
            if (this.type === 'image') {
                promise = ImageLabelsApi
                    .save({image_id: this.image.id}, {label_id: this.selectedLabel.id});
            } else {
                promise = VideoLabelsApi
                    .save({video_id: this.image.id}, {label_id: this.selectedLabel.id});
            }

            promise.then(this.labelAttached, this.attachingFailed)
                .finally(this.resetSuccess)
                .finally(() => this.saving = false);
        },
        labelAttached(response) {
            this.attachingSuccess = true;
            this.image.labels.push(response.data);
        },
        attachingFailed(response) {
            this.attachingSuccess = false;
            handleErrorResponse(response);
        },
        resetSuccess() {
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => this.attachingSuccess = null, 3000);
        },
        removeImageLabel(item) {
            let index = this.image.labels.indexOf(item);
            if (index !== -1) {
                this.image.labels.splice(index, 1);
            }
        },
    },
    created() {
        this.userId = biigle.$require('volumes.userId');
        this.isAdmin = biigle.$require('volumes.isAdmin');
        this.showAnnotationRoute = biigle.$require('largo.showAnnotationRoute');
    },
};
</script>
