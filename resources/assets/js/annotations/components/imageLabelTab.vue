<script>
import FileLabelsTab from '../mixins/fileLabelsTab.vue';

export default {
    template: '#image-labels-tab-template',
    extends: FileLabelsTab,
    created() {
        this.userId = biigle.$require('annotations.userId');
        this.isAdmin = biigle.$require('annotations.isAdmin');
    },
};
</script>
