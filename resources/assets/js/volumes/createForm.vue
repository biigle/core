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
        fileBrowser: FileBrowser,
    },
    data() {
        return {
            disks: [],
            filenames: '',
            filenamesReadFromMetadata: false,
            fileSource: FILE_SOURCE.REMOTE,
            hadMetadataText: false,
            handle: '',
            imageDiskCache: {},
            initializingBrowser: false,
            loadingBrowser: false,
            loadingImport: false,
            mediaType: MEDIA_TYPE.IMAGE,
            metadataText: '',
            name: '',
            selectedDiskRoot: null,
            storageDisk: null,
            url: '',
            videoDiskCache: {},
        };
    },
    computed: {
        showFilenameWarning() {
            return this.filenames.includes('.tif');
        },
        hasDirectories() {
            return this.currentDirectories.length > 0;
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
        isDiskFileSource() {
            return this.fileSource === FILE_SOURCE.DISK;
        },
        isUserDiskFileSource() {
            return this.fileSource === FILE_SOURCE.USER_DISK;
        },
        showFileBrowser() {
            return this.isDiskFileSource || this.isUserDiskFileSource;
        },
        storageDiskEmpty() {
            if (this.initializingBrowser) {
                return false;
            }

            let root = this.selectedDiskRoot;

            return !root || (root.files.length === 0 && Object.keys(root.directories).length === 0);
        },
        emptyText() {
            if (this.isVideoMediaType) {
                return 'no videos';
            }

            return 'no images';
        },
        cannotSubmit() {
            return this.name === '' || this.url === '' || this.filenames === '' || this.loading;
        },
        fileCount() {
            return this.filenames.split(',').filter(f => f).length;
        },
        fileCountText() {
            return numberFormatter.format(this.fileCount);
        },
    },
    methods: {
        fetchDirectories(disk, path) {
            return BrowserApi.get({disk: disk, path: path});
        },
        fetchFiles(disk, path) {
            if (this.isVideoMediaType) {
                return BrowserApi.getVideos({disk: disk, path: path});
            }

            return BrowserApi.getImages({disk: disk, path: path});
        },
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
        fetchDirectoryContent(disk, path) {
            return Vue.Promise.all([
                    this.fetchDirectories(disk, path),
                    this.fetchFiles(disk, path),
                ])
                .then(this.parseBrowserResponses);
        },
        setFiles(response) {
            this.filenames = response.body.join(', ');
        },
        resetFileSource() {
            this.selectRemoteFileSource();
        },
        selectImageMediaType() {
            this.mediaType = MEDIA_TYPE.IMAGE;
            this.resetFileSource();
        },
        selectVideoMediaType() {
            this.mediaType = MEDIA_TYPE.VIDEO;
            this.resetFileSource();
        },
        setCsvMetadata(event) {
            this.hasMetadataCsv = true;
            let file = event.target.files[0];
            this.readCsvMetadataText(file).then((text) => {
                this.metadataText = text;
                if (!this.filenames && this.isRemoteFileSource) {
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
            if (!this.url && this.isRemoteFileSource) {
                this.url = ifdo.url;
            }
            if (!this.handle) {
                this.handle = ifdo.handle;
            }
            if (!this.filenames && this.isRemoteFileSource) {
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
            if (!this.isRemoteFileSource) {
                this.fileSource = FILE_SOURCE.REMOTE;
                this.storageDisk = null;
                this.selectedDiskRoot = null;
                this.url = '';
                this.filenames = '';
            }
        },
        selectStorageDisk(disk) {
            if (this.storageDisk !== disk) {
                if (this.disks.includes(disk)) {
                    this.fileSource = FILE_SOURCE.DISK;
                } else if (disk.startsWith('user-')) {
                    this.fileSource = FILE_SOURCE.USER_DISK;
                } else {
                    return;
                }

                this.selectedDiskRoot = null;
                this.storageDisk = disk;
                this.url = '';
                this.filenames = '';
            }
        },
        showStorageDiskRoot(disk) {
            let cache = this.isVideoMediaType ? this.videoDiskCache : this.imageDiskCache;

            if (!cache.hasOwnProperty(disk)) {
                cache[disk] = this.fetchDirectoryContent(disk, '')
                    .then(this.setStorageDiskRoot, handleErrorResponse);
            }

            return cache[disk];
        },
        setStorageDiskRoot(args) {
            let [dirs, files] = args;

            return {
                name: '',
                directories: dirs,
                files: files,
                loaded: true,
            };
        },
        handleLoadDirectory(directory, path) {
            directory.loading = true;
            // Remove leading slash.
            path = path.slice(1);

            return this.fetchDirectoryContent(this.storageDisk, path)
                    .then(function (args) {
                        let [dirs, files] = args;
                        directory.directories = dirs;
                        directory.files = files;
                        directory.loaded = true;

                        return directory;
                    }, handleErrorResponse)
                    .finally(() => directory.loading = false);
        },
        unselectAllDirectories(directory) {
            directory.selected = false;
            directory.files.forEach(file => file.selected = false);
            Object.keys(directory.directories).forEach((key) => {
                this.unselectAllDirectories(directory.directories[key]);
            });
        },
        selectDirectory(directory, path) {
            let promise;
            if (!directory.loaded) {
                promise = this.handleLoadDirectory(directory, path);
            } else {
                promise = Vue.Promise.resolve(directory);
            }

            promise.then((directory) => {
                this.unselectAllDirectories(this.selectedDiskRoot);
                if (directory.files.length > 0) {
                    directory.selected = true;
                    directory.files.forEach(file => file.selected = true);
                    this.setUrlAndFilenames(path, directory.files);
                }
            });
        },
        setUrlAndFilenames(path, files) {
            // Add only one slash, as path already has a leading slash.
            this.url = `${this.storageDisk}:/${path}`;
            this.filenames = files.map(file => file.name).join(', ');
        },
        unselectDirectory(directory) {
            this.unselectAllDirectories(directory);
            this.url = '';
            this.filenames = '';
        },
        recurseLoadDirectories(path) {
            let breadcrumbs = path.split('/');
            let currentDir = breadcrumbs.pop();
            let promise;

            if (breadcrumbs.length > 1) {
                promise = this.recurseLoadDirectories(breadcrumbs.join('/'));
            } else {
                promise = Vue.Promise.resolve(this.selectedDiskRoot);
            }

            return promise.then((directory) => {
                if (!directory.directories.hasOwnProperty(currentDir)) {
                    throw `Directory '${currentDir}' not found`;
                }

                return this.handleLoadDirectory(
                    directory.directories[currentDir], path
                );
            });
        },
        initializeSelectedStorageDiskAfterError(disk, path) {
            this.storageDisk = disk;
            this.fileSource = FILE_SOURCE.DISK;
            // A leading slash is expected in the subsequent functions.
            path = '/' + path;

            this.initializingBrowser = true;
            this.showStorageDiskRoot(disk)
                .then(root => this.selectedDiskRoot = root)
                .then(() => this.recurseLoadDirectories(path))
                .then((dir) => this.selectDirectory(dir, path))
                .finally(() => this.initializingBrowser = false);
        },
        selectFile(file, directory, path, event) {
            let selectedFiles = directory.files.filter(f => f.selected);
            if (event.ctrlKey && selectedFiles.length > 0) {
                selectedFiles.push(file)
                if (selectedFiles.length === directory.files.length) {
                    this.selectDirectory(directory, path);
                } else {
                    file.selected = true;
                    this.setUrlAndFilenames(path, selectedFiles);
                }
            } else {
                this.unselectAllDirectories(this.selectedDiskRoot);
                if (directory.files.length === 1) {
                    this.selectDirectory(directory, path);
                } else {
                    file.selected = true;
                }
                this.setUrlAndFilenames(path, [file]);
            }
        },
        unselectFile(file, directory, path, event) {
            if (event.ctrlKey) {
                file.selected = false;
                let selectedFiles = directory.files.filter(f => f.selected);
                if (selectedFiles.length > 0) {
                    directory.selected = false;
                    this.setUrlAndFilenames(path, selectedFiles);
                } else {
                    this.unselectDirectory(directory);
                }
            } else {
                this.selectFile(file, directory, path, event);
            }
        },
    },
    watch: {
        storageDisk(disk) {
            if (disk) {
                this.initializingBrowser = true;
                this.showStorageDiskRoot(disk)
                    .then(root => this.selectedDiskRoot = root)
                    .finally(() => this.initializingBrowser = false);
            }
        },
        selectedDiskRoot(newRoot, oldRoot) {
            if (oldRoot) {
                this.unselectAllDirectories(oldRoot);
            }
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

        let [disk, path] = this.url.split('://');
        if (this.disks.includes(disk)) {
            this.initializeSelectedStorageDiskAfterError(disk, path);
        }
    },
    mounted() {
        // Vue disables the autofocus attribute somehow, so set focus manually here.
        this.$refs.nameInput.focus();
    },
};
</script>
