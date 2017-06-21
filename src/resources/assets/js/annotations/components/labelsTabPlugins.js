/**
 * The plugin component to show example annotation patches in the labels tab of the
 * annotation tool.
 *
 * @type {Object}
 */
biigle.$require('annotations.components.labelsTabPlugins').exampleAnnotations = {
    mixins: [biigle.$require('core.mixins.loader')],
    components: {
        annotationPatch: biigle.$require('largo.components.annotationPatch'),
    },
    props: {
        label: {
            default: null,
        },
        volumeId: {
            type: Number,
            required: true,
        },
        count: {
            type: Number,
            default: 3,
        },
    },
    data: function () {
        return {
            exampleLabel: null,
            exampleAnnotations: [],
            cache: {},
            shown: true,
        };
    },
    computed: {
        isShown: function () {
            return this.shown && this.label !== null;
        },
        hasExamples: function () {
            return this.exampleLabel && this.exampleAnnotations && this.exampleAnnotations.length > 0;
        },
        volumesApi: function () {
            return  biigle.$require('largo.api.volumes');
        },
    },
    methods: {
        parseResponse: function (response) {
            return response.data;
        },
        setExampleAnnotations: function (args) {
            // Delete the cached item if there is less than the desired number of example
            // annotations. Maybe there are more the next time we fetch them again.
            if (!args[0].hasOwnProperty('annotations') || args[0].annotations.length < this.count) {
                delete this.cache[args[1]];
            }

            // Also delete the cached item if there are only examples with a similar
            // label. Maybe there are examples from the requested label the next time.
            if (!args[0].hasOwnProperty('label') || args[0].label.id !== args[1]) {
                delete this.cache[args[1]];
            }

            // Only set the example annotations if the received data belongs to the
            // currently selected label. The user might have selected another label in
            // the meantime.
            if (this.label && this.label.id === args[1]) {
                this.exampleAnnotations = args[0].annotations;
                this.exampleLabel = args[0].label;
            }
        },
        updateShown: function (shown) {
            this.shown = shown;
        },
        updateExampleAnnotations: function () {
            this.exampleAnnotations = [];

            // Note that this includes the check for label !== null.
            if (this.isShown) {
                this.startLoading();

                if (!this.cache.hasOwnProperty(this.label.id)) {
                    this.cache[this.label.id] = this.volumesApi.queryExampleAnnotations({
                            id: this.volumeId,
                            label_id: this.label.id,
                            take: this.count,
                        })
                        .then(this.parseResponse);
                }

                Vue.Promise.all([this.cache[this.label.id], this.label.id])
                    .then(this.setExampleAnnotations)
                    .finally(this.finishLoading);
            }
        },
    },
    watch: {
        label: function () {
            this.updateExampleAnnotations();
        },
        shown: function () {
            this.updateExampleAnnotations();
        },
    },
    created: function () {
        biigle.$require('events').$on('settings.exampleAnnotations', this.updateShown);
    },
};
