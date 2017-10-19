/**
 * The image information tab of the annotation tool
 *
 * @type {Object}
 */
biigle.$component('annotations.components.imageInfoTab', {
    mixins: [biigle.$require('core.mixins.loader')],
    components: {
        imageLabelList: biigle.$require('volumes.components.imageLabelList'),
    },
    props: {
        imageId: {
            required: true,
            type: Number,
        },
        selectedLabel: {
            type: Object,
            default: null,
        },
    },
    data: function () {
        return {
            cache: {},
            open: false,
            currentInfo: null,
        };
    },
    computed: {
        userId: function () {
            return biigle.$require('annotations.userId');
        },
        isAdmin: function () {
            return biigle.$require('annotations.isAdmin');
        },
        imageApi: function () {
            return biigle.$require('api.images');
        },
        hasExif: function () {
            return this.currentInfo && this.currentInfo.hasOwnProperty('exif');
        },
        currentExif: function () {
            if (this.hasExif) {
                return this.currentInfo.exif;
            }

            return null;
        },
        hasLabels: function () {
            return this.currentInfo && this.currentInfo.hasOwnProperty('labels') && this.currentInfo.labels.length > 0;
        },
        currentLabels: function () {
            if (this.hasLabels) {
                return this.currentInfo.labels;
            }

            return [];
        },
        hasSelectedLabel: function () {
            return this.selectedLabel !== null;
        },
        canAttachSelectedLabel: function () {
            if (this.hasSelectedLabel) {
                for (var i = this.currentLabels.length - 1; i >= 0; i--) {
                    if (this.currentLabels[i].label.id === this.selectedLabel.id) {
                        return false;
                    }
                }

                return true;
            }

            return false;
        },
        proposedLabelTitle: function () {
            return 'Attach ' + this.hasSelectedLabel.name + ' as new image label';
        },
        proposedLabelStyle: function () {
            return 'background-color: #' + this.selectedLabel.color;
        },
    },
    methods: {
        showImageInfo: function (id) {
            if (!this.cache.hasOwnProperty(id)) {
                this.startLoading();
                this.cache[id] = this.imageApi.get({id: id});
                this.cache[id].finally(this.finishLoading);
            }

            this.cache[id].then(this.updateCurrentInfo, biigle.$require('messages.store').handleErrorResponse);
        },
        updateCurrentInfo: function (response) {
            this.currentInfo = response.body;
        },
        handleDeletedLabel: function (label) {
            for (var i = this.currentLabels.length - 1; i >= 0; i--) {
                if (this.currentLabels[i].id === label.id) {
                    this.currentLabels.splice(i, 1);
                    break;
                }
            }
        },
        attachSelectedLabel: function () {
            console.log('attach', this.selectedLabel);
        }
    },
    watch: {
        imageId: function (id) {
            if (this.open) {
                this.showImageInfo(id);
            }
        },
        open: function (open) {
            if (open) {
                this.showImageInfo(this.imageId);
            }
        },
    },
    created: function () {
        var self = this;
        this.$parent.$watch('open', function (open) {
            self.open = open;
        });
    }
});
