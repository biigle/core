biigle.$component('videos.mixins.annotationFilter', {
    template:
    '<typeahead' +
        ' :items="items"' +
        ' :placeholder="placeholder"' +
        ' :value="selectedItemName"' +
        ' @select="select"' +
        '></typeahead>',
    components: {
        typeahead: biigle.$require('core.components.typeahead'),
    },
    data: function () {
        return {
            name: '',
            placeholder: '',
            selectedItem: null,
        };
    },
    computed: {
        items: function () {
            return [];
        },
        selectedItemName: function () {
            return this.selectedItem ? this.selectedItem.name : '';
        },
    },
    methods: {
        select: function (item) {
            this.selectedItem = item;
            this.$emit('select', this);
        },
        filter: function (annotations) {
            return annotations;
        },
        reset: function () {
            this.selectedItem = null;
        },
    },
    created: function () {
        this.$mount();
    },
});
