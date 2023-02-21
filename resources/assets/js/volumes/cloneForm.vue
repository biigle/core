<script>
import LoaderMixin from '../core/mixins/loader';
import Dropdown from "uiv/dist/Dropdown";


// const numberFormatter = new Intl.NumberFormat();

/**
 * View model for the create volume form.
 */
export default {
    mixins: [LoaderMixin],
    components: {
        dropdown: Dropdown,
    },
    data() {
        return {
            name: '',
            destinationProjects: [],
            files: [],
            selectedProject: "",
            text: '',
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
        this.text = 'test1234';


    },
    mounted() {
        // Vue disables the autofocus attribute somehow, so set focus manually here.
        this.$refs.nameInput.focus();
    },
};
</script>
