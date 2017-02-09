/**
 * Store for the volume image filters
 */
biigle.$declare('volumes.stores.filters', [
    // default filters
    {
        id: 'imageLabel',
        label: 'image label',
        listComponent: {
            template: '<span><strong>with<span v-if="rule.negate">out</span></strong> image label <strong v-text="rule.data.name"></strong></span>',
            props: {
                rule: {
                    type: Object,
                    required: true,
                }
            },
        },
        selectComponent: {
            template: '<typeahead :items="labels" placeholder="Label name" @select="select"></typeahead>',
            components: {
                typeahead: biigle.$require('core.components.typeahead'),
            },
            props: {
                volumeId: {
                    type: Number,
                    required: true,
                }
            },
            data: function () {
                return {labels: []};
            },
            methods: {
                select: function (label) {
                    this.$emit('select', label);
                },
                gotImageLabels: function (response) {
                    this.labels = response.data;
                },
            },
            created: function () {
                biigle.$require('api.volumes').queryImageLabels({id: this.volumeId})
                    .then(this.gotImageLabels, biigle.$require('messages.store').handleErrorResponse);
            },
        },
        getSequence: function (volumeId, label) {
            return biigle.$require('api.volumes').queryImagesWithImageLabel({
                id: volumeId,
                label_id: label.id,
            });
        }
    }
]);
