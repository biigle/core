<script>
import BrowserApi from './api/browser';
import LoaderMixin from '../core/mixins/loader';
import {handleErrorResponse} from '../core/messages/store';

/**
 * View model for the create volume form.
 */
export default {
    mixins: [LoaderMixin],
    data() {
        return {
            disks: [],
            url: null,
            filenames: null,
            browsing: false,
            storageDisk: null,
            breadCrumbs: [],
            currentDirectories: [],
            loadingBrowser: false,
            directoryCache: {},
            fileCache: {},
        };
    },
    computed: {
        showFilenameWarning() {
            return this.filenames.includes('.tif');
        },
        hasDirectories() {
            return this.currentDirectories.length > 0;
        },
        buttonClass() {
            return {
                'btn-info': this.browsing,
            };
        },
        canGoBack() {
            return this.breadCrumbs.length > 0 || this.disks.length > 1;
        },
        hasCurrentDirectory() {
            return this.breadCrumbs.length > 0;
        },
        currentDirectory() {
            if (this.hasCurrentDirectory) {
                return this.breadCrumbs[this.breadCrumbs.length - 1];
            }

            return null;
        },
    },
    methods: {
        toggleBrowse() {
            this.browsing = !this.browsing;
        },
        fetchDirectories(disk, path) {
            let key = disk + '://' + path;
            if (!this.directoryCache.hasOwnProperty(key)) {
                this.loadingBrowser = true;

                let promise = BrowserApi.get({disk: disk, path: path});
                promise.finally(() => this.loadingBrowser = false);
                this.directoryCache[key] = promise;
            }

            return this.directoryCache[key];
        },
        showDirectories(response) {
            this.currentDirectories = response.body;
        },
        openDirectory(directory) {
            this.breadCrumbs.push(directory);
        },
        goBack() {
            if (this.breadCrumbs.length > 0) {
                this.breadCrumbs.pop();
            } else if (this.disks.length > 1) {
                this.storageDisk = null;
            }
        },
        goTo(i) {
            if (i >= -1 && i < this.breadCrumbs.length) {
                this.breadCrumbs = this.breadCrumbs.slice(0, i + 1);
            }
        },
        fetchFiles(disk, path) {
            let key = disk + '://' + path;
            if (!this.fileCache.hasOwnProperty(key)) {
                this.loadingBrowser = true;

                // TODO get videos if the volume media type is video
                let promise = BrowserApi.getImages({disk: disk, path: path});
                promise.finally(() => this.loadingBrowser = false);
                this.fileCache[key] = promise;
            }

            return this.fileCache[key];
        },
        setFiles(response) {
            this.filenames = response.body.join(', ');
        },
        selectDirectory(directory) {
            let crumbs = this.breadCrumbs.slice();
            if (directory) {
                crumbs.push(directory);
            }
            this.fetchFiles(this.storageDisk, crumbs.join('/'))
                .then(this.setFiles)
                .then(() => this.url = this.storageDisk + '://' + crumbs.join('/'))
                .catch(handleErrorResponse);
        },
    },
    watch: {
        storageDisk(disk) {
            if (disk) {
                this.fetchDirectories(disk, '').then(this.showDirectories, handleErrorResponse);
            }
        },
        breadCrumbs(crumbs) {
            this.fetchDirectories(this.storageDisk, crumbs.join('/'))
                .then(this.showDirectories)
                .catch(function (response) {
                    crumbs.pop();
                    handleErrorResponse(response);
                });
        },
    },
    created() {
        this.disks = biigle.$require('volumes.disks');
        this.url = biigle.$require('volumes.url');
        this.filenames = biigle.$require('volumes.filenames');

        if (this.disks.length === 1) {
            this.storageDisk = this.disks[0];
        }
    },
    mounted() {
        // Vue disables the autofocus attribute somehow, so set focus manually here.
        this.$refs.nameInput.focus();
    },
};
</script>
