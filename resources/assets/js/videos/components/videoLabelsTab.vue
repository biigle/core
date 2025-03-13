<script>
import FileLabelsTab from '@/annotations/mixins/fileLabelsTab.vue';

export default {
    template: '#video-labels-tab-template',
    extends: FileLabelsTab,
    created() {
        let user = biigle.$require('videos.user');
        this.userId = user ? user.id : null;
        this.isAdmin = biigle.$require('videos.isAdmin');
    },
};
</script>
