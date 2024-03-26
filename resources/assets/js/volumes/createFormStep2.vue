<script>
import BrowserApi from './api/browser';
import Dropdown from 'uiv/dist/Dropdown';
import FileBrowser from '../core/components/fileBrowser';
import LoaderMixin from '../core/mixins/loader';
import {debounce} from '../core/utils';
import {MEDIA_TYPE} from './createFormStep1';

const FILE_SOURCE = {
    REMOTE: 'remote',
    DISK: 'disk',
    USER_DISK: 'user-disk',
};

const numberFormatter = new Intl.NumberFormat();

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
            filesDontMatchMetadata: false,
            fileSource: FILE_SOURCE.REMOTE,
            handle: '',
            imageDiskCache: {},
            importAnnotations: false,
            importFileLabels: false,
            initialized: false,
            initializingBrowser: false,
            loadingBrowser: false,
            mediaType: MEDIA_TYPE.IMAGE,
            metadataFilenames: [],
            name: '',
            remoteFilenames: '',
            remoteUrl: '',
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
        remoteButtonClass() {
            return {
                active: this.isRemoteFileSource,
                'btn-info': this.isRemoteFileSource,
            };
        },
        userDiskButtonClass() {
            return {
                active: this.isUserDiskFileSource,
                'btn-info': this.isUserDiskFileSource,
            };
        },
        diskButtonClass() {
            return {
                active: this.isDiskFileSource,
                'btn-info': this.isDiskFileSource,
            };
        },
        importAnnotationsButtonClass() {
            return {
                active: this.importAnnotations,
                'btn-info': this.importAnnotations,
            };
        },
        importFileLabelsButtonClass() {
            return {
                active: this.importFileLabels,
                'btn-info': this.importFileLabels,
            };
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
        selectRemoteFileSource() {
            if (!this.isRemoteFileSource) {
                this.fileSource = FILE_SOURCE.REMOTE;
                this.storageDisk = null;
                this.selectedDiskRoot = null;
                this.url = this.remoteUrl;
                this.filenames = this.remoteFilenames;
            }
        },
        selectStorageDisk(disk) {
            if (!this.storageDisk) {
                // Make a backup so the remote filenames and URL can be restored if the
                // user switches back from a storage disk to a remote source.
                this.remoteFilenames = this.filenames;
                this.remoteUrl = this.url;
            }

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
                    .then(this.setStorageDiskRoot, this.handleErrorResponse);
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
                    }, this.handleErrorResponse)
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
                this.unselectDirectory(this.selectedDiskRoot);
                directory.selected = true;
                if (directory.files.length > 0) {
                    directory.files.forEach(file => file.selected = true);
                    this.setUrlAndFilenames(path, directory.files);
                }
            });
        },
        setUrlAndFilenames(path, files) {
            // Add only one slash, as path already has a leading slash.
            this.url = `${this.storageDisk}:/${path}`;
            this.filenames = files.map(file => file.name).join(',');
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
        initializeSelectedFilesAfterError(directory, path) {
            let files = this.filenames.split(',').map(f => f.trim())
            if (files.length === directory.files.length) {
                this.selectDirectory(directory, path);
            } else {
                // Hack to expand the directory but not select it.
                directory.selected = true;
                this.$nextTick(() => directory.selected = false);

                directory.files
                    .filter(f => files.includes(f.name))
                    .forEach(f => f.selected = true);
            }
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
                .then((dir) => this.initializeSelectedFilesAfterError(dir, path))
                .finally(() => this.initializingBrowser = false);
        },
        selectFile(file, directory, path, event) {
            let selectedFiles = directory.files.filter(f => f.selected);
            if (event?.ctrlKey && selectedFiles.length > 0) {
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
            if (event?.ctrlKey) {
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
        toggleImportAnnotations() {
            this.importAnnotations = !this.importAnnotations;
        },
        toggleImportFileLabels() {
            this.importFileLabels = !this.importFileLabels;
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
        filenames() {
            if (this.metadataFilenames.length === 0 || !this.filenames || !this.filenames.includes('.')) {
                this.filesDontMatchMetadata = false;
                return;
            }

            // Use a watcher+debounce instead of a computed property because this may be
            // called on each keystroke in the textarea.
            debounce(() => {
                if (!this.filenames || !this.filenames.includes('.')) {
                    this.filesDontMatchMetadata = false;
                    return;
                }

                for (var i = this.metadataFilenames.length - 1; i >= 0; i--) {
                    if (this.filenames.includes(this.metadataFilenames[i])) {
                        this.filesDontMatchMetadata = false;
                        return;
                    }
                }

                this.filesDontMatchMetadata = true;
            }, 1000, 'compare-volume-filenames-with-metadata');
        },
    },
    created() {
        this.disks = biigle.$require('volumes.disks');
        this.url = biigle.$require('volumes.url');
        this.name = biigle.$require('volumes.name');
        this.handle = biigle.$require('volumes.handle');
        this.mediaType = biigle.$require('volumes.mediaType');
        this.filenames = biigle.$require('volumes.filenames');
        if (biigle.$require('volumes.filenamesFromMeta')) {
            this.metadataFilenames = this.filenames.split(',');
        }

        let [disk, path] = this.url.split('://');
        if (this.disks.includes(disk)) {
            this.initializeSelectedStorageDiskAfterError(disk, path);
        }
    },
    mounted() {
        // Vue disables the autofocus attribute somehow, so set focus manually here.
        this.$refs.nameInput.focus();
        // Used to mask some flashing elements on pageload.
        this.initialized = true;
    },
};
</script>
