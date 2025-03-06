<template>
    <figure
        class="preview-thumbnail"
        @mousemove="updateIndex($event)"
        @mouseenter="setHovered"
        @mouseleave="unsetHovered"
        @click="emitClick"
        >
            <span
                v-show="showButtons"
                class="preview-thumbnail__buttons"
                >
                <button
                    v-if="showStatsButton"
                    class="btn btn-default btn-sm"
                    @click.prevent="showStatistics"
                    :title="statisticsTitle"
                    >
                    <loader v-if="loading" :active="true"></loader>
                    <i v-else class="fas fa-chart-bar"></i>
                </button>
                <a
                    v-if="showCloneButton"
                    :href="volumeCloneUrl"
                    class="btn btn-default btn-sm"
                    :title="cloneVolumeTitle"
                >
                    <i class="fas fa-clone"></i>
                </a>
                <button
                    v-if="removable"
                    class="btn btn-default btn-sm"
                    @click.prevent="remove"
                    :title="removeTitle"
                    >
                    <i class="fas fa-trash"></i>
                </button>
            </span>
            <i
                v-if="hasIcon"
                v-show="!hasButtons || !showButtons"
                class="preview-thumbnail__icon fas fa-lg"
                :class="iconClass"
                ></i>
            <div v-if="touched" v-show="showPreview" class="preview-thumbnail__images">
                <img
                    v-for="(uri, i) in uris"
                    v-show="thumbShown(i)"
                    @load="uriLoaded(i)"
                    :src="uri"
                    >
            </div>
            <div v-show="!showPreview" class="preview-thumbnail__fallback">
                <slot></slot>
            </div>
            <slot name="caption"></slot>
            <span
                v-show="someLoaded"
                class="preview-thumbnail__progress"
                :style="{width: progress}"
                ></span>
    </figure>
</template>

<script>
/**
 * An interactive thumbnail that shows an overview of (volume) images
 * on mousemove.
 *
 * @type {Object}
 */
import LoaderMixin from '@/core/mixins/loader.vue';
import volumeStatisticsApi from '../api/volumeStatistics.js';
import {handleErrorResponse} from '@/core/messages/store.js';

export default {
    emits: [
        'click',
        'statistics',
        'remove',
    ],
    mixins: [LoaderMixin],
    props: {
        id: {
            // This can be a string in the search view.
            type: [Number, String],
            required: true,
        },
        // Either as array or comma separated string.
        thumbUris: {
            required: true,
        },
        removable: {
            type: Boolean,
            default: false,
        },
        removeTitle: {
            type: String,
            default: 'Remove this volume',
        },
        statisticsTitle: {
            type: String,
            default: 'Show charts',
        },
        icon: {
            type: String,
        },
        showStatsButton: {
            type: Boolean,
            default: false,
        },
        volumeUrlTemplate: {
            type: String,
            default: ""
        },
        cloneVolumeTitle:{
            type: String,
            default: "Clone volume"
        },
        showCloneButton: {
            type: Boolean,
            default: false,
        }
    },
    data() {
        return {
            index: 0,
            uris: [],
            loaded: [],
            touched: false,
            hovered: false,
            statisticsData: null,
        };
    },
    computed: {
        // Width of the progress bar.
        progress() {
            return (100 * this.index / (this.uris.length - 1)) + '%';
        },
        showFallback() {
            return this.uris[this.index] === false;
        },
        showPreview() {
            return this.touched && this.someLoaded;
        },
        someLoaded() {
            return this.loaded.some(item => item);
        },
        iconClass() {
            return this.icon ? 'fa-' + this.icon : '';
        },
        hasIcon() {
            return this.icon;
        },
        showButtons() {
            return this.hovered || this.loading;
        },
        hasButtons() {
            return this.removable || this.showStatsButton || this.showCloneButton;
        },
        volumeCloneUrl() {
            return this.volumeUrlTemplate.replace(':id', String(this.id));
        }
    },
    methods: {
        thumbShown(i) {
            return this.index === i && this.loaded[i];
        },
        updateIndex(event) {
            let rect = this.$el.getBoundingClientRect();
            this.index = Math.max(0, Math.floor(this.uris.length * (event.clientX - rect.left) / (rect.width)));
        },
        remove() {
            this.$emit('remove', this.id);
        },
        showStatistics() {
            if (this.loading) {
                return
            }

            // If statistics modal has been opened before, use cached data
            if (this.statisticsData !== null) {
                this.$emit('statistics', this.statisticsData)
            } else {
                this.startLoading();
                // api request to get data for specific volume
                volumeStatisticsApi.get({id: this.id})
                    .then((response) => {
                        this.$emit('statistics', response.data)
                        this.statisticsData = response.data;
                    }, handleErrorResponse)
                    .finally(this.finishLoading);
            }
        },
        uriLoaded(i) {
            this.loaded.splice(i, 1, true);
        },
        setHovered() {
            this.hovered = true;
            this.touched = true;
        },
        unsetHovered() {
            this.hovered = false;
        },
        emitClick(e) {
            this.$emit('click', e);
        },
    },
    created() {
        if (Array.isArray(this.thumbUris)) {
            this.uris = this.thumbUris.slice();
        } else {
            this.uris = this.thumbUris.split(',');
        }

        this.loaded = this.uris.map(() => false);
    },
};
</script>
