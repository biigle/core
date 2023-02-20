<script>
import LoaderMixin from '../core/mixins/loader';


// const numberFormatter = new Intl.NumberFormat();

/**
 * View model for the create volume form.
 */
export default {
    mixins: [LoaderMixin],
    data() {
        return {
            name: '',
            destinationProjects: [],
            files: [],
            destinationId: -1,
        };
    },
    computed: {
    },
    methods: {
    },
    watch: {
    },
    created() {
        this.name = biigle.$require('name');
        this.destinationProjects = biigle.$require('$destProjects');
        this.files = biigle.$require('files');


    },
    mounted() {
        // Vue disables the autofocus attribute somehow, so set focus manually here.
        this.$refs.nameInput.focus();
    },
};
</script>
