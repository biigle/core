<template>
    <span>
        <span v-if="showIndicator" :title="progressTitle" class="progress-indicator-container">
            <svg class="progress-indicator" :class="indicatorClass" viewBox="-0.2 -0.2 2.4 2.4">
                <circle class="progress-indicator__background" cx="1" cy="1" r="1"></circle>
                <g class="progress-indicator__progress">
                    <circle v-cloak v-if="progress==1" cx="1" cy="1" r="1"></circle>
                    <path v-else :d="progressPath"></path>
                </g>
                <path v-cloak v-if="showInitialProgressMarker" class="progress-indicator__marker" :d="initialProgressPath"></path>
            </svg>
        </span>
        <strong :title="filenameTitle" :class="filenameClass" v-text="currentFilename"></strong>
    </span>
</template>
<script>
import {capitalize} from '@/core/utils.js';

const arcPosition = function (percent) {
    return [
        Math.cos(2 * Math.PI * percent) + 1,
        Math.sin(2 * Math.PI * percent) + 1,
    ];
};

export default {
    props: {
        fileIds: {
            type: Array,
            default: function () {
                return [];
            },
        },
        filenames: {
            type: Object,
            default: function () {
                return {};
            },
        },
        showIndicator: {
            type: Boolean,
            default: true,
        },
        currentFileId: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            fileIdsLeft: [],
        };
    },
    computed: {
        progressPath() {
            let largeArc = this.progress >= 0.5 ? 1 : 0;
            let position = arcPosition(this.progress);

            return 'M 2 1 A 1 1 0 ' + largeArc + ' 1 ' + position.join(' ') + 'L 1 1';
        },
        initialProgressPath() {
            let position = arcPosition(this.initialProgress);

            return 'M 1 1 L ' + position.join(' ');
        },
        progressTitle() {
            let additions = [`started at ${this.initialFileNumber}`];
            if (this.hasSeenAllFiles) {
                additions.push('seen all');
            }

            return `${capitalize(this.type)} ${this.currentFileNumber} of ${this.fileIds.length} (${additions.join(', ')})`;
        },
        currentFileNumber() {
            if (this.currentFileId) {
                return this.fileIds.indexOf(this.currentFileId) + 1;
            }

            return 0;
        },
        progress() {
            return this.currentFileNumber / this.fileIds.length;
        },
        initialProgress() {
            return this.initialFileNumber / this.fileIds.length;
        },
        hasSeenAllFiles() {
            return this.fileIdsLeft.length === 0;
        },
        showInitialProgressMarker() {
            return this.initialFileNumber !== 1;
        },
        indicatorClass() {
            return this.hasSeenAllFiles ? 'progress-indicator--all' : '';
        },
        filenameClass() {
            return this.hasSeenAllFiles ? 'text-success' : '';
        },
        filenameTitle() {
            return this.hasSeenAllFiles ? `You have seen all ${this.type}s` : '';
        },
        currentFilename() {
            return this.filenames[this.currentFileId];
        },
    },
    watch: {
        currentFileId(currentId) {
            this.fileIdsLeft = this.fileIdsLeft.filter(id => id !== currentId);
        },
    },
    created() {
        this.initialFileNumber = this.fileIds.indexOf(this.currentFileId) + 1;
        this.fileIdsLeft = this.fileIds.filter(id => id !== this.currentFileId);
    },
};
</script>
