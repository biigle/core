<script>
import BrowserApi from './api/browser';
import Dropdown from 'uiv/dist/Dropdown';
import LoaderMixin from '../core/mixins/loader';
import {handleErrorResponse} from '../core/messages/store';

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
            disks: [],
            url: null,
            mediaType: '',
            filenames: null,
            filenamesReadFromMetadata: false,
            browsing: false,
            storageDisk: null,
            breadCrumbs: [],
            currentDirectories: [],
            loadingBrowser: false,
            directoryCache: {},
            fileCache: {},
            metadataText: '',
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
        isImageMediaType() {
            return this.mediaType === 'image';
        },
        isVideoMediaType() {
            return this.mediaType === 'video';
        },
        isRemoteImageVolume() {
            return this.isImageMediaType && this.url.search(/^https?:\/\//) !== -1;
        },
        hasMetadata() {
            return this.isImageMediaType && this.metadataText.length > 0;
        },
        importButtonClass() {
            if (this.hasMetadata) {
                return 'btn-info';
            }
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
        selectImageMediaType() {
            this.mediaType = 'image';
        },
        selectVideoMediaType() {
            this.mediaType = 'video';
        },
        setCsvMetadata(event) {
            this.hasMetadataCsv = true;
            let file = event.target.files[0];
            this.readCsvMetadataText(file).then((text) => {
                this.metadataText = text;
                if (!this.filenames) {
                    this.filenames = this.parseMetadataTextFilenames(text);
                    this.filenamesReadFromMetadata = true;
                }
                // Reset input field so the file is not uploaded, too.
                event.target.value = '';
            })
        },
        readCsvMetadataText(file) {
            let reader = new FileReader();
            let promise = new Promise(function (resolve, reject) {
                reader.onload = resolve;
                reader.onerror = reject;
            });
            reader.readAsText(file);

            return promise.then(function () {
                return reader.result;
            });
        },
        parseMetadataTextFilenames(text) {
            let rows = text.split("\n");
            let columns = rows.shift();
            let filenameColumn = columns.split(',').indexOf('filename')

            return rows.map(function (row) {
                return row.split(',')[filenameColumn];
            })
            .join(', ');
        },
        importCsv() {
            this.$refs.metadataCsvField.click();
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
        this.metadataText = biigle.$require('volumes.metadataText');
        this.mediaType = biigle.$require('volumes.mediaType');
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
