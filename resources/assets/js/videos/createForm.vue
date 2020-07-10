<script>
import LoaderMixin from '../core/mixins/loader';

export default {
    mixins: [LoaderMixin],
    mounted() {
        // Vue disables the autofocus attribute somehow, so set focus manually here.
        this.$refs.nameInput.focus();
    },
};
</script>
