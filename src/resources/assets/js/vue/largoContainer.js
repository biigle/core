/**
 * The panel for editing the title information of a label tree
 */
biigle.$viewModel('largo-container', function (element) {
    var messages = biigle.$require('messages.store');

    var volumesApi = biigle.$require('largo.api.volumes');
    var volumeId = biigle.$require('largo.volumeId');

    new Vue({
        el: element,
        mixins: [
            biigle.$require('core.mixins.loader'),
        ],
        components: {
            labelTrees: biigle.$require('labelTrees.components.labelTrees'),
            sidebar: biigle.$require('core.components.sidebar'),
            sidebarTab: biigle.$require('core.components.sidebarTab'),
        },
        data: {
            labelTrees: biigle.$require('largo.labelTrees'),
            step: 0,
            selectedLabel: null,
            annotationsCache: {},
        },
        computed: {
            isInDismissStep: function () {
                return this.step === 0;
            },
            isInRelabelStep: function () {
                return this.step === 1;
            },
            annotations: function () {
                if (this.selectedLabel && this.annotationsCache.hasOwnProperty(this.selectedLabel.id)) {
                    return this.annotationsCache[this.selectedLabel.id];
                }

                return [];
            }
        },
        methods: {
            getAnnotations: function (label) {
                if (!this.annotationsCache.hasOwnProperty(label.id)) {
                    var self = this;
                    // Load only once
                    Vue.set(self.annotationsCache, label.id, []);
                    this.startLoading();
                    volumesApi.queryAnnotations({id: volumeId, label_id: label.id})
                        .then(function (response) {
                            Vue.set(self.annotationsCache, label.id, response.data);
                        }, messages.handleResponseError)
                        .finally(this.finishLoading);
                }
            },
            handleSelectedLabel: function (label) {
                this.selectedLabel = label;

                if (this.isInDismissStep) {
                    this.getAnnotations(label);
                }
            },
            handleDeselectedLabel: function () {
                this.selectedLabel = null;
            },
        },
        created: function () {
        }
    });
});
