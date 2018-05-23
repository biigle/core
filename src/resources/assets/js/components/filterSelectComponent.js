/**
 * Base component for a filter select element
 *
 * @type {Object}
 */
biigle.$component('volumes.components.filterSelectComponent', {
    template: '<div class="filter-select">' +
        '<typeahead :items="items" :value="value" :placeholder="placeholder" @select="select" :template="typeaheadTemplate"></typeahead>' +
        '<button type="submit" class="btn btn-default" @click="submit" :disabled="!selectedItem">Add rule</button>' +
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
            typeaheadTemplate: undefined,
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
        parseUsernames: function (response) {
            response.data = response.data.map(function (user) {
                user.name = user.firstname + ' ' + user.lastname;
                return user;
            });

            return response;
        },
        submit: function () {
            this.$emit('select', this.selectedItem);
        },
    },
});
