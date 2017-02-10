/**
 * Base component for a filter select element
 *
 * @type {Object}
 */
biigle.$component('volumes.components.filterSelectComponent', {
    template: '<div class="filter-select">' +
        '<typeahead :items="items" :value="value" :placeholder="placeholder" @select="select"></typeahead>' +
        '<button type="submit" class="btn btn-default" @click="submit" :disabled="!selectedItem">Add rule</button>' +
        '<div v-if="help" class="help-block" v-text="help"></div>' +
    '</div>',
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
        return {
            items: [],
            placeholder: '',
            selectedItem: null,
        };
    },
    computed: {
        value: function () {
            return this.selectedItem ? this.selectedItem.name : '';
        },
    },
    methods: {
        select: function (item) {
            this.selectedItem = item;
        },
        gotItems: function (response) {
            this.items = response.data;
        },
        submit: function () {
            this.$emit('select', this.selectedItem);
        },
    },
});
