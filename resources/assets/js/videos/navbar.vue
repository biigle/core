<script>
import Breadcrumb from '@/annotations/components/breadcrumb.vue';
import Events from '@/core/events.js';
import Settings from './stores/settings.js';

export default {
    components: {
        breadcrumb: Breadcrumb,
    },
    data() {
        return {
            ids: [],
            volumeId: null,
            filenames: {},
            showIndicator: true,
            currentId: null,
        };
    },
    computed: {
        currentFilename() {
            return this.filenames[this.currentId];
        },
    },
    methods: {
        updateShowIndicator(show) {
            this.showIndicator = show !== false;
        },
        updateCurrentId(id) {
            this.currentId = id;
        },
        initVideoIds(ids) {
            // Look for a sequence of video IDs in local storage. This sequence is
            // produced by the volume overview page when the files are sorted or
            // filtered. We want to reflect the same ordering or filtering here
            // in the annotation tool.
            let storedSequence = window.localStorage.getItem(`biigle.volumes.${this.volumeId}.files`);
            if (storedSequence) {
                // If there is such a stored sequence, filter out any image IDs that
                // do not belong to the volume (any more), since some of them may
                // have been deleted in the meantime.
                let map = {};
                ids.forEach(function (id) {
                    map[id] = null;
                });
                return JSON.parse(storedSequence).filter((id) => map.hasOwnProperty(id));
            }

            return ids;
        },
    },
    watch: {
        currentFilename(filename) {
            document.title = `Annotate ${filename} - BIIGLE`;
        },
    },
    created() {
        this.volumeId = biigle.$require('videos.volumeId');
        let allIds = biigle.$require('videos.videoIds');
        this.ids = this.initVideoIds(allIds);
        let filenames = {};
        biigle.$require('videos.videoFilenames').forEach((filename, index) => {
            filenames[allIds[index]] = filename;
        });
        this.filenames = filenames;
        this.currentId = biigle.$require('videos.id');

        this.updateShowIndicator(Settings.get('showProgressIndicator'));
        Settings.watch('showProgressIndicator', this.updateShowIndicator);
        Events.$on('video.id', this.updateCurrentId);
    },
};
</script>
