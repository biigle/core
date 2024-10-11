<script>
import FilesStore from './stores/files.vue';

/**
 * View model for the file count of the volume overview
 */
export default {
    data() {
        return {
            fileIds: [],
        };
    },
    computed: {
        count() {
            return FilesStore.count;
        },
        text() {
            if (this.count === this.fileIds.length) {
                return this.count;
            }

            return this.count + ' of ' + this.fileIds.length;
        },
    },
    created() {
        this.fileIds = biigle.$require('volumes.fileIds');
    },
};
</script>
