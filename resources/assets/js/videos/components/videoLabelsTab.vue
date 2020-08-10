<script>
import FileLabelsTab from '../../annotations/mixins/fileLabelsTab';

export default {
    mixins: [FileLabelsTab],
    created() {
        this.userId = biigle.$require('videos.userId');
        this.isAdmin = biigle.$require('videos.isAdmin');
    },
};
</script>
