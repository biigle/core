/**
 * View model for the example annotations
 */
biigle.$viewModel('largo-example-annotations', function (element) {
    var events = biigle.$require('events');
    var messages = biigle.$require('messages.store');
    var labelsApi = biigle.$require('largo.api.labels');

    new Vue({
        el: element,
        mixins: [biigle.$require('core.mixins.loader')],
        components: {
            annotationPatch: biigle.$require('largo.components.annotationPatch')
        },
        data: {
            selectedLabel: null,
            cache: {
                null: Vue.Promise.resolve([]),
            },
            exampleAnnotations: [],
        },
        computed: {
            hasSelectedLabel: function () {
                return this.selectedLabel !== null;
            },
            hasExampleAnnotations: function () {
                return this.exampleAnnotations.length > 0;
            },
            selectedLabelName: function () {
                if (this.hasSelectedLabel) {
                    return this.selectedLabel.name;
                }

                return '';
            },
        },
        methods: {
            parseResponse: function (response) {
                return response.data;
            },
            setSelectedLabel: function (label) {
                this.selectedLabel = label;
                var id = label ? label.id : null;

                if (!this.cache.hasOwnProperty(id)) {
                    this.startLoading();
                    this.cache[id] = labelsApi.queryAnnotations({id: id, take: 4})
                        .then(this.parseResponse)
                        .catch(messages.handleErrorResponse)
                        .finally(this.finishLoading);
                }

                this.cache[id].then(this.setExampleAnnotations);
            },
            setExampleAnnotations: function (annotations) {
                this.exampleAnnotations = annotations;
            },
        },
        created: function () {
            events.$on('selectLabel', this.setSelectedLabel);
        },
    });
});
