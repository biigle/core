/**
 * One list item of the annotations tab
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationsTabItem', {
    components: {
        annotationItem: biigle.$require('annotations.components.annotationsTabSubItem'),
    },
    props: {
        item: {
            type: Object,
            required: true,
        },
    },
    data: function () {
        return {
            isOpen: false,
        };
    },
    computed: {
        label: function () {
            return this.item.label;
        },
        annotationItems: function () {
            return this.item.annotations;
        },
        count: function () {
            return this.annotationItems.length;
        },
        hasSelectedAnnotation: function () {
            var items = this.annotationItems;
            for (var i = items.length - 1; i >= 0; i--) {
                if (items[i].annotation.selected === true) {
                    return true;
                }
            }

            return false;
        },
        isSelected: function () {
            return this.isOpen || this.hasSelectedAnnotation;
        },
        classObject: function () {
            return {
                selected: this.isSelected,
            };
        },
        colorStyle: function () {
            return {
                'background-color': '#' + this.label.color,
            };
        },
        title: function () {
            return 'List all annotations with label ' + this.label.name;
        },
        countTitle: function () {
            return 'There are ' + this.count + ' annotations with this label';
        },
    },
    methods: {
        toggleOpen: function () {
            this.isOpen = !this.isOpen;
        },
        bubbleSelect: function (element) {
            this.$emit('select', element);
        },
    },
});
