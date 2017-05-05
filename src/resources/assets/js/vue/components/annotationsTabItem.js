/**
 * One list item of the annotations tab
 *
 * @type {Object}
 */
biigle.$component('annotations.components.annotationsTabItem', {
    props: {
        item: {
            type: Object,
            required: true,
        },
    },
    computed: {
        label: function () {
            return this.item.label;
        },
        annotations: function () {
            return this.item.annotations;
        },
        count: function () {
            return this.annotations.length;
        },
        isSelected: function () {
            var annotations = this.annotations;
            for (var i = annotations.length - 1; i >= 0; i--) {
                if (annotations[i].selected === true) {
                    return true;
                }
            }

            return false;
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
});
