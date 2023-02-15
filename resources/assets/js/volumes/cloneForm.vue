<script>
import BrowserApi from './api/browser';
import Dropdown from 'uiv/dist/Dropdown';
import FileBrowser from '../core/components/fileBrowser';
import LoaderMixin from '../core/mixins/loader';
import ParseIfdoFileApi from '../volumes/api/parseIfdoFile';
import {handleErrorResponse} from '../core/messages/store';

const MEDIA_TYPE = {
    IMAGE: 'image',
    VIDEO: 'video',
};

const FILE_SOURCE = {
    REMOTE: 'remote',
    DISK: 'disk',
    USER_DISK: 'user-disk',
};

const numberFormatter = new Intl.NumberFormat();

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
            files: []
        };
    },
    computed: {

        cannotSubmit() {
            return this.name === '' || this.url === '' || this.filenames === '' || this.loading;
        },
        fileCountText() {
            return numberFormatter.format(this.fileCount);
        },
    },
    methods: {
        parseBrowserResponses(responses) {
            let [dirResponse, fileResponse] = responses;
            let directories = {};
            dirResponse.body.forEach(function (path) {
                directories[path] = {
                    name: path,
                    directories: {},
                    files: [],
                    loaded: false,
                    loading: false,
                    selected: false,
                };
            });

            let files = fileResponse.body.map(function (name) {
                return {
                    name: name,
                    selected: false,
                };
            });

            return [directories, files];
        },
        setFiles(response) {
            this.filenames = response.body.join(', ');
        },
    },
    watch: {
    },
    created() {
        this.name = biigle.$require('name');
        this.destinationProjects = biigle.$require('destinationProjects');
        this.files = biigle.$require('files');


    },
    mounted() {
        // Vue disables the autofocus attribute somehow, so set focus manually here.
        this.$refs.nameInput.focus();
    },
};
</script>
