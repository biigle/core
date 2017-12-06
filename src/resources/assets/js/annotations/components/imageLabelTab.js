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
            currentLabels: [],
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
        imageLabelApi: function () {
            return biigle.$require('api.imageLabels');
        },
        hasLabels: function () {
            return this.currentLabels.length > 0;
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
            if (!this.hasSelectedLabel) {
                return 'Please select a label first.';
            } else if (!this.canAttachSelectedLabel) {
                return 'The selected label is already attached.';
            }

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
        showImageLabels: function (id) {
            if (!this.cache.hasOwnProperty(id)) {
                this.startLoading();
                this.currentLabels = [];
                this.cache[id] = this.imageLabelApi.query({image_id: id});
                this.cache[id].finally(this.finishLoading);
            }

            this.cache[id].then(this.updateCurrentLabels, biigle.$require('messages.store').handleErrorResponse);
        },
        updateCurrentLabels: function (response) {
            this.currentLabels = response.body;
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
            var labels = this.currentLabels;

            this.imageLabelApi.save({image_id: this.imageId}, {label_id: this.selectedLabel.id})
                .then(function (response) {
                    labels.push(response.data);
                }, biigle.$require('messages.store').handleErrorResponse)
                .finally(this.finishSaving);
        },
    },
    watch: {
        imageId: function (id) {
            if (this.open) {
                this.showImageLabels(id);
            }
        },
        open: function (open) {
            if (open) {
                this.showImageLabels(this.imageId);
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
