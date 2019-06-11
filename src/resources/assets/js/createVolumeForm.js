/**
 * View model for the create volume form.
 */
biigle.$viewModel('create-volume-form', function (element) {
    var browserApi = biigle.$require('volumes.api.browser');
    var disks = biigle.$require('volumes.disks');
    var messages = biigle.$require('messages.store');

    new Vue({
        el: element,
        mixins: [biigle.$require('core.mixins.loader')],
        data: {
            url: biigle.$require('volumes.url'),
            filenames: biigle.$require('volumes.filenames'),
            browsing: false,
            storageDisk: null,
            breadCrumbs: [],
            currentDirectories: [],
            loadingBrowser: false,
            directoryCache: {},
            fileCache: {},
        },
        computed: {
            showFilenameWarning: function () {
                return this.filenames.includes('.tif');
            },
            hasDirectories: function () {
                return this.currentDirectories.length > 0;
            },
            buttonClass: function () {
                return {'btn-info': this.browsing};
            },
            canGoBack: function () {
                return this.breadCrumbs.length > 0 || disks.length > 1;
            },
            hasCurrentDirectory: function () {
                return this.breadCrumbs.length > 0;
            },
            currentDirectory: function () {
                if (this.hasCurrentDirectory) {
                    return this.breadCrumbs[this.breadCrumbs.length - 1];
                }

                return null;
            },
        },
        methods: {
            toggleBrowse: function () {
                this.browsing = !this.browsing;
            },
            fetchDirectories: function (disk, path) {
                var key = disk + '://' + path;
                if (!this.directoryCache.hasOwnProperty(key)) {
                    this.loadingBrowser = true;

                    var promise = browserApi.get({disk: disk, path: path}).bind(this);
                    promise.finally(function () {
                        this.loadingBrowser = false;
                    });
                    this.directoryCache[key] = promise;
                }

                return this.directoryCache[key];
            },
            showDirectories: function (response) {
                this.currentDirectories = response.body;
            },
            openDirectory: function (directory) {
                this.breadCrumbs.push(directory);
            },
            goBack: function () {
                if (this.breadCrumbs.length > 0) {
                    this.breadCrumbs.pop();
                } else if (disks.length > 1) {
                    this.storageDisk = null;
                }
            },
            goTo: function (i) {
                if (i >= -1 && i < this.breadCrumbs.length) {
                    this.breadCrumbs = this.breadCrumbs.slice(0, i + 1);
                }
            },
            fetchImages: function (disk, path) {
                var key = disk + '://' + path;
                if (!this.fileCache.hasOwnProperty(key)) {
                    this.loadingBrowser = true;

                    var promise = browserApi.getImages({disk: disk, path: path}).bind(this);
                    promise.finally(function () {
                        this.loadingBrowser = false;
                    });
                    this.fileCache[key] = promise;
                }

                return this.fileCache[key];
            },
            setImages: function (response) {
                this.filenames = response.body.join(', ');
            },
            selectDirectory: function (directory) {
                var crumbs = this.breadCrumbs.slice();
                if (directory) {
                    crumbs.push(directory);
                }
                this.fetchImages(this.storageDisk, crumbs.join('/'))
                    .then(this.setImages)
                    .then(function () {
                        this.url = this.storageDisk + '://' + crumbs.join('/');
                    })
                    .catch(messages.handleErrorResponse);
            },
        },
        watch: {
            storageDisk: function (disk) {
                if (disk) {
                    this.fetchDirectories(disk, '').then(this.showDirectories, messages.handleErrorResponse);
                }
            },
            breadCrumbs: function (crumbs) {
                this.fetchDirectories(this.storageDisk, crumbs.join('/'))
                    .then(this.showDirectories)
                    .catch(function (response) {
                        crumbs.pop();
                        messages.handleErrorResponse(response);
                    });
            },
        },
        created: function () {
            if (disks.length === 1) {
                this.storageDisk = disks[0];
            }
        },
        mounted: function () {
            // Vue disables the autofocus attribute somehow, so set focus manually here.
            this.$refs.nameInput.focus();
        },
    });
});
