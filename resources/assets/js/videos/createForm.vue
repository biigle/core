<script>
import {LoaderMixin} from './import';

export default {
    mixins: [LoaderMixin],
    mounted() {
        // Vue disables the autofocus attribute somehow, so set focus manually here.
        this.$refs.nameInput.focus();
    },
};
</script>
