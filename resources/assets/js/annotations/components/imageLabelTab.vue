<script>
import FileLabelsTab from '../mixins/fileLabelsTab';

export default {
    mixins: [FileLabelsTab],
    created() {
        this.userId = biigle.$require('annotations.userId');
        this.isAdmin = biigle.$require('annotations.isAdmin');
    },
};
</script>
