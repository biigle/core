<script>
import BrowserApi from './api/browser';
import Dropdown from 'uiv/dist/Dropdown';
import LoaderMixin from '../core/mixins/loader';
import ParseIfdoFileApi from '../volumes/api/parseIfdoFile';
import {handleErrorResponse} from '../core/messages/store';

const MEDIA_TYPE = {
    IMAGE: 'image',
    VIDEO: 'video',
};

const FILE_SOURCE = {
    REMOTE: 'remote',
};

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
            name: '',
            url: null,
            mediaType: '',
            handle: '',
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
            loadingImport: false,
            hadMetadataText: false,
            fileSource: FILE_SOURCE.REMOTE,
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
            return this.mediaType === MEDIA_TYPE.IMAGE;
        },
        isVideoMediaType() {
            return this.mediaType === MEDIA_TYPE.VIDEO;
        },
        isRemoteImageVolume() {
            return this.isImageMediaType && this.url.search(/^https?:\/\//) !== -1;
        },
        hasMetadata() {
            return this.isImageMediaType && this.metadataText.length > 0;
        },
        showImportAgainMessage() {
            return this.hadMetadataText && !this.hasMetadata;
        },
        isRemoteFileSource() {
            return this.fileSource === FILE_SOURCE.REMOTE;
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
            this.mediaType = MEDIA_TYPE.IMAGE;
        },
        selectVideoMediaType() {
            this.mediaType = MEDIA_TYPE.VIDEO;
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
            let metadata = text.split("\n").map(row => row.split(','));

            return this.parseMetadataFilenames(metadata);
        },
        importCsv() {
            this.$refs.metadataCsvField.click();
        },
        importIfdo() {
            this.$refs.metadataIfdoField.click();
        },
        parseIfdoMetadata(event) {
            let data = new FormData();
            data.append('file', event.target.files[0]);
            this.loadingImport = true;
            ParseIfdoFileApi.save(data)
                .then(this.setIfdoMetadata, handleErrorResponse)
                .finally(() => this.loadingImport = false);
        },
        setIfdoMetadata(response) {
            let ifdo = response.body;
            if (!this.name) {
                this.name = ifdo.name;
            }
            if (!this.url) {
                this.url = ifdo.url;
            }
            if (!this.handle) {
                this.handle = ifdo.handle;
            }
            if (!this.filenames) {
                this.filenames = this.parseMetadataFilenames(ifdo.files);
                this.filenamesReadFromMetadata = true;
            }

            this.metadataText = ifdo.files.map(row => row.join(',')).join("\n");
        },
        parseMetadataFilenames(metadata) {
            let columns = metadata[0];
            let filenameColumn = columns.indexOf('filename')

            return metadata.slice(1).map(row => row[filenameColumn]).join(', ');
        },
        clearMetadata() {
            this.metadataText = '';
            this.$refs.metadataIfdoField.value = '';
        },
        selectRemoteFileSource() {
            this.fileSource = FILE_SOURCE.REMOTE;
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
        hasMetadata(hasMetadata) {
            if (hasMetadata) {
                // Don't show message again once a metadata file had been selected.
                this.hadMetadataText = false;
            }
        },
    },
    created() {
        this.disks = biigle.$require('volumes.disks');
        this.url = biigle.$require('volumes.url');
        this.name = biigle.$require('volumes.name');
        this.handle = biigle.$require('volumes.handle');
        this.hadMetadataText = biigle.$require('volumes.hadMetadataText');
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
