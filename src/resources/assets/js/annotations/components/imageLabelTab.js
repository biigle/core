/**
 * The image information tab of the annotation tool
 *
 * @type {Object}
 */
biigle.$component('annotations.components.imageLabelTab', {
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
            saving: false,
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
            return 'Attach \'' + this.selectedLabel.name + '\' as new image label';
        },
    },
    methods: {
        startSaving: function () {
            this.saving = true;
        },
        finishSaving: function () {
            this.saving = false;
        },
        showImageInfo: function (id) {
            if (!this.cache.hasOwnProperty(id)) {
                this.startLoading();
                this.currentInfo = null;
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
            this.startSaving();
            var labels = this.currentInfo.labels;

            biigle.$require('api.imageLabels')
                .save({image_id: this.imageId}, {label_id: this.selectedLabel.id})
                .then(function (response) {
                    labels.push(response.data);
                }, biigle.$require('messages.store').handleErrorResponse)
                .finally(this.finishSaving);
        },
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
