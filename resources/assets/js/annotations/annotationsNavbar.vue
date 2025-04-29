<script>
import Events from '@/core/events.js';
import Settings from './stores/settings.js';
import Breadcrumb from './components/breadcrumb.vue';

/**
* View model for the annotator navbar
*/
export default {
    components: {
        breadcrumb: Breadcrumb,
    },
    data() {
        return {
            volumeId: null,
            allIds: [],
            filenames: {},
            showIndicator: true,
            currentId: null,
        };
    },
    computed: {
        currentFilename() {
            return this.filenames[this.currentId];
        },
        ids() {
            let imagesIds = this.allIds.slice();
            // Look for a sequence of image IDs in local storage. This sequence is
            // produced by the volume overview page when the files are sorted or
            // filtered. We want to reflect the same ordering or filtering here
            // in the annotation tool.
            let storedSequence = window.localStorage.getItem(`biigle.volumes.${this.volumeId}.files`);
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
        updateShowIndicator(show) {
            this.showIndicator = show !== false;
        },
        updateCurrentId(e) {
            this.currentId = e.id;
        },
    },
    watch: {
        currentFilename(filename) {
            document.title = `Annotate ${filename} - BIIGLE`;
        },
    },
    created() {
        this.allIds = biigle.$require('annotations.imagesIds');
        this.volumeId = biigle.$require('annotations.volumeId');
        let filenames = {};
        biigle.$require('annotations.imagesFilenames').forEach((filename, index) => {
            filenames[this.allIds[index]] = filename;
        });
        this.filenames = filenames;
        this.currentId = biigle.$require('annotations.imageId');

        Events.on('images.change', this.updateCurrentId);

        this.updateShowIndicator(Settings.get('progressIndicator'));
        Settings.watch('progressIndicator', this.updateShowIndicator);
    },
};
</script>
