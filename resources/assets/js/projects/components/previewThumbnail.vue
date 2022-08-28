<template>
    <figure
        class="preview-thumbnail"
        @mousemove="updateIndex($event)"
        @mouseenter="setHovered"
        @mouseleave="unsetHovered"
        @click="emitClick"
        >
            <i
                v-if="showIcon"
                class="preview-thumbnail__icon fas fa-lg"
                :class="iconClass"
                ></i>
            <button
                v-if="showRemove"
                class="btn btn-default btn-sm preview-thumbnail__icon"
                @click.prevent="remove"
                :title="removeTitle"
                >
                <i class="fas fa-trash"></i>
            </button>
            <button
                v-if="showStatistics"
                class="btn btn-default btn-sm preview-thumbnail__icon2"
                @click.prevent="statistics"
                :title="statisticsTitle"
                >
                <loader v-if="loading" :active="true"></loader>
                <i v-else class="fas fa-chart-bar"></i>
            </button>
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
import LoaderMixin from '../../core/mixins/loader';
import volumeStatisticsApi from '../api/volumeStatistics';
import {handleErrorResponse} from '../../core/messages/store';



export default {
    mixins: [LoaderMixin],
    props: {
        id: {
            type: Number,
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
            default: 'Show statistics',
        },
        icon: {
            type: String,
        },
    },
    data() {
        return {
            index: 0,
            uris: [],
            loaded: [],
            touched: false,
            hovered: false,
            // TODO: Caching
            statisticsVisited: false,
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
        showIcon() {
            if (this.removable) {
                return !this.hovered && this.icon;
            }

            return this.icon;
        },
        showRemove() {
            return this.removable && this.hovered;
        },
        showStatistics() {
            return this.removable && this.hovered;
        },
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
        statistics() {
            // If statistics modal has been opened before, use cached data
            if(this.statisticsVisited) {
                this.$emit('statistics', this.statisticsData)
            } else {
                this.startLoading();
                // api request to get data for specific volume
                volumeStatisticsApi.get({id: this.id})
                .then(response => {
                    this.$emit('statistics', response.data), handleErrorResponse
                    this.statisticsData = response.data;
                    this.statisticsVisited = true;
                    })
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
    }
};
</script>
