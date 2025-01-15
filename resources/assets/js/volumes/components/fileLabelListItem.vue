<template>
    <li class="file-label" :class="classObject">
        <span class="file-label__color" :style="colorStyle"></span>
        <span v-text="label.name" :title="title"></span>
        <button v-if="!deleting && deletable" class="close file-label__delete" :title="deleteTitle" @click.stop="deleteThis"><span aria-hidden="true">&times;</span></button>
    </li>
</template>

<script>
import ImageLabelsApi from '../api/imageLabels.js';
import VideoLabelsApi from '../api/videoLabels.js';
import {handleErrorResponse} from '@/core/messages/store.js';

/**
 * One item in the imageLabelList component.
 *
 * @type {Object}
 */
export default {
    props: {
        item: {
            type: Object,
            required: true,
        },
        deletable: {
            type: Boolean,
            default: false,
        },
        type: {
            type: String,
            default: 'image',
        },
    },
    data() {
        return {
            deleting: false,
        };
    },
    computed: {
        label() {
            return this.item.label;
        },
        colorStyle() {
            return {
                'background-color': '#' + this.label.color
            };
        },
        deleteTitle() {
            return 'Detach label ' + this.label.name;
        },
        title() {
            return `Attached by ${this.item.user.firstname} ${this.item.user.lastname}`;
        },
        classObject() {
            return {
                'image-label--deleting': this.deleting,
            };
        },
        labelsApi() {
            return this.type === 'image' ? ImageLabelsApi : VideoLabelsApi;
        },
    },
    methods: {
        deleteThis() {
            if (this.deleting) return;

            this.deleting = true;
            this.labelsApi.delete({id: this.item.id})
                .then(this.deleted, handleErrorResponse)
                .finally(() => this.deleting = false);
        },
        deleted() {
            this.$emit('deleted', this.item);
        },
    }
};
</script>
