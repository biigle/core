/**
 * View model for the main Largo container
 */
biigle.$viewModel('largo-container', function (element) {
    var messages = biigle.$require('messages.store');
    var volumesApi = biigle.$require('largo.api.volumes');
    var volumeId = biigle.$require('largo.volumeId');
    var events = biigle.$require('largo.stores.events');

    new Vue({
        el: element,
        mixins: [
            biigle.$require('core.mixins.loader'),
        ],
        components: {
            labelTrees: biigle.$require('labelTrees.components.labelTrees'),
            sidebar: biigle.$require('core.components.sidebar'),
            sidebarTab: biigle.$require('core.components.sidebarTab'),
            imageGrid: biigle.$require('largo.components.dismissImageGrid'),
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
            },
            allAnnotations: function () {
                var annotations = [];
                for (var id in this.annotationsCache) {
                    if (!this.annotationsCache.hasOwnProperty(id)) continue;
                    Array.prototype.push.apply(annotations, this.annotationsCache[id]);
                }

                return annotations;
            },
            hasNoAnnotations: function () {
                return this.selectedLabel && !this.loading && this.annotations.length === 0;
            },
            dismissedAnnotations: function () {
                return this.allAnnotations.filter(function (item) {
                    return item.dismissed;
                });
            },
            hasDismissedAnnotations: function () {
                return this.dismissedAnnotations.length > 0;
            },
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
                            self.gotAnnotations(label, response.data);
                        }, messages.handleResponseError)
                        .finally(this.finishLoading);
                }
            },
            gotAnnotations: function (label, annotations) {
                // This is the object that we will use to store information for each
                // annotation patch.
                annotations = annotations.map(function (id) {
                    return {
                        id: id,
                        blob: null,
                        dismissed: false,
                        newLabel: null,
                    };
                });

                Vue.set(this.annotationsCache, label.id, annotations);
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
            handleDismissedImage: function (image) {
                image.dismissed = true;
            },
            handleUndismissedImage: function (image) {
                image.dismissed = false;
            },
        },
        watch: {
            annotations: function (annotations) {
                events.$emit('annotations-count', annotations.length);
            },
            step: function (step) {
                events.$emit('step', step);
            },
        },
        created: function () {
        }
    });
});
