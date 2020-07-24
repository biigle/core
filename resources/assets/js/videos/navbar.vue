<script>
import Breadcrumb from '../annotations/components/breadcrumb';
import Settings from './stores/settings';

export default {
    components: {
        breadcrumb: Breadcrumb,
    },
    data() {
        return {
            ids: [],
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
    },
    watch: {
        currentFilename(filename) {
            document.title = `Annotate ${filename} - BIIGLE`;
        },
    },
    created() {
        this.ids = biigle.$require('videos.videoIds').slice();
        let filenames = {};
        biigle.$require('videos.videoFilenames').forEach((filename, index) => {
            filenames[this.ids[index]] = filename;
        });
        this.filenames = filenames;
        this.currentId = biigle.$require('videos.id');

        this.updateShowIndicator(Settings.get('showProgressIndicator'));
        Settings.watch('showProgressIndicator', this.updateShowIndicator);
    },
};
</script>
