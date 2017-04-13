/**
 * One item in the imageLabelList component.
 *
 * @type {Object}
 */
biigle.$component('volumes.components.imageLabelListItem', {
    template: '<li class="image-label" :class="classObject">' +
        '<span class="image-label__color" :style="colorStyle"></span>' +
        '<span v-text="label.name" :title="title"></span>' +
        '<button v-if="!deleting && deletable" class="close image-label__delete" :title="deleteTitle" @click.stop="deleteThis"><span aria-hidden="true">&times;</span></button>' +
    '</li>',
    props: {
        item: {
            type: Object,
            required: true,
        },
        deletable: {
            type: Boolean,
            default: false,
        },
    },
    data: function () {
        return {
            deleting: false,
        };
    },
    computed: {
        label: function () {
            return this.item.label;
        },
        colorStyle: function () {
            return {
                'background-color': '#' + this.label.color
            };
        },
        deleteTitle: function () {
            return 'Detach label ' + this.label.name;
        },
        title: function () {
            return 'Attached by ' + this.item.user.firstname + ' ' +this.item.user.lastname;
        },
        classObject: function () {
            return {
                'image-label--deleting': this.deleting,
            };
        },
    },
    methods: {
        deleteThis: function () {
            if (this.deleting) return;

            var self = this;
            this.deleting = true;
            biigle.$require('api.imageLabels').delete({id: this.item.id})
                .then(this.deleted, biigle.$require('messages.store').handleErrorResponse)
                .finally(function () {self.deleting = false;});
        },
        deleted: function () {
            this.$emit('deleted', this.item);
        },
    }
});
