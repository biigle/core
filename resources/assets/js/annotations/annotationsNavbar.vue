<script>
import Events from '../core/events';
import FilenameTracker from './mixins/imageFilenameTracker';
import Settings from './stores/settings';

/**
* View model for the annotator navbar
*/
export default {
    mixins: [FilenameTracker],
    data() {
        return {
            volumeId: null,
            allImageIds: [],
            imageIdsLeft: [],
            initialImageId: null,
            showIndicator: true,
        };
    },
    computed: {
        progressPath() {
            let largeArc = this.progress >= 0.5 ? 1 : 0;
            let position = this.arcPosition(this.progress);

            return 'M 2 1 A 1 1 0 ' + largeArc + ' 1 ' + position.join(' ') + 'L 1 1';
        },
        initialProgressPath() {
            let position = this.arcPosition(this.initialProgress);

            return 'M 1 1 L ' + position.join(' ');
        },
        progressTitle() {
            let additions = [`started at ${this.initialImageNumber}`];
            if (this.hasSeenAllImages) {
                additions.push('seen all');
            }

            return `Image ${this.currentImageNumber} of ${this.imageIds.length} (${additions.join(', ')})`;
        },
        currentImageNumber() {
            if (this.currentImageId) {
                return this.imageIds.indexOf(this.currentImageId) + 1;
            }

            return 0;
        },
        progress() {
            return this.currentImageNumber / this.imageIds.length;
        },
        initialImageNumber() {
            if (this.initialImageId === null) {
                return 1;
            }

            return this.imageIds.indexOf(this.initialImageId) + 1;
        },
        initialProgress() {
            return this.initialImageNumber / this.imageIds.length;
        },
        hasSeenAllImages() {
            return this.imageIdsLeft.length === 0;
        },
        showInitialProgressMarker() {
            return this.initialImageNumber !== 1;
        },
        indicatorClass() {
            return this.hasSeenAllImages ? 'progress-indicator--all' : '';
        },
        filenameClass() {
            return this.hasSeenAllImages ? 'text-success' : '';
        },
        filenameTitle() {
            return this.hasSeenAllImages ? 'You have seen all images' : '';
        },
        imageIds() {
            let imagesIds = this.allImageIds.slice();
            // Look for a sequence of image IDs in local storage. This sequence is
            // produced by the volume overview page when the files are sorted or
            // filtered. We want to reflect the same ordering or filtering here
            // in the annotation tool.
            let storedSequence = window.localStorage.getItem(`biigle.volumes.${this.volumeId}.images`);
            if (storedSequence) {
                // If there is such a stored sequence, filter out any image IDs that
                // do not belong to the volume (any more), since some of them may
                // have been deleted in the meantime.
                let map = {};
                imagesIds.forEach(function (id) {
                    map[id] = null;
                });
                return JSON.parse(storedSequence).filter((id) => map.hasOwnProperty(id));
            }

            return imagesIds;
        },
    },
    methods: {
        arcPosition(percent) {
            return [
                Math.cos(2 * Math.PI * percent) + 1,
                Math.sin(2 * Math.PI * percent) + 1,
            ];
        },
        setInitialImageId(id) {
            this.initialImageId = id;
        },
        updateShowIndicator(show) {
            this.showIndicator = show !== false;
        },
    },
    watch: {
        currentImageId(id) {
            let ids = this.imageIdsLeft;
            for (let i = ids.length - 1; i >= 0; i--) {
                if (ids[i] === id) {
                    ids.splice(i, 1);
                    break;
                }
            }
        },
        currentImageFilename(filename) {
            document.title = `Annotate ${filename}`;
        },
    },
    created() {
        this.allImageIds = biigle.$require('annotations.imagesIds');
        this.volumeId = biigle.$require('annotations.volumeId');
        this.imageIdsLeft = this.imageIds.slice()

        Events.$once('images.change', this.setInitialImageId);

        this.updateShowIndicator(Settings.get('progressIndicator'));
        Settings.watch('progressIndicator', this.updateShowIndicator);
    },
    mounted() {
        // Take the pre-filled content of the element when the page is initially
        // loaded until the image id has been set. Otherwise the filename would
        // vanish and appear again what we don't want.
        this.defaultFilename = this.$el.attributes.getNamedItem('default-filename').value;
    }
};
</script>
