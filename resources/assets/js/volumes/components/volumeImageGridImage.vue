<template>
    <figure class="image-grid__image image-grid__image--volume" :class="classObject" :title="title">
        <a v-if="!selectable && image.annotateUrl" :href="image.annotateUrl" title="Annotate this image" class="image-link">
            <img :src="url || emptyUrl" @error="showEmptyImage">
        </a>
        <img v-else @click="handleClick" :src="url || emptyUrl" @error="showEmptyImage">
        <span v-if="showFilename" class="image-filename" :title="image.filename" v-text="image.filename"></span>
        <div class="image-buttons">
            <a v-if="image.imageUrl" :href="image.imageUrl" class="image-button" title="View image information">
                <span class="fa fa-info-circle" aria-hidden="true"></span>
            </a>
        </div>
        <div v-if="showLabels" class="image-labels" @wheel.stop>
            <image-label-list :image-labels="image.labels" :user-id="userId" :is-admin="isAdmin" @deleted="removeImageLabel"></image-label-list>
        </div>
    </figure>
</template>

<script>
import Image from './imageGridImage';
import ImageLabelsApi from '../api/imageLabels';
import LabelList from './imageLabelList';
import LoaderMixin from '../../core/mixins/loader';
import {handleErrorResponse} from '../../core/messages/store';

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
        imageLabelList: LabelList,
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
    },
    methods: {
        handleClick() {
            if (!this.canBeSelected) {
                return;
            }

            this.saving = true;
            ImageLabelsApi
                .save({image_id: this.image.id}, {label_id: this.selectedLabel.id})
                .then(this.labelAttached, this.attachingFailed)
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
