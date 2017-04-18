/**
 * List of image labels.
 *
 * @type {Object}
 */
biigle.$component('volumes.components.imageLabelList', {
    template: '<ul class="image-label-list">' +
        '<list-item v-for="item in imageLabels" :item="item" :deletable="canDelete(item)" @deleted="emitDeleted"></list-item>' +
        '<li v-if="!hasImageLabels" class="text-muted">No image labels</li>' +
    '</ul>',
    components: {
        listItem: biigle.$require('volumes.components.imageLabelListItem'),
    },
    props: {
        imageLabels: {
            type: Array,
            required: true,
        },
    },
    data: function () {
        return {
            userId: biigle.$require('volumes.userId'),
            isAdmin: biigle.$require('volumes.isAdmin'),
        };
    },
    computed: {
        hasImageLabels: function () {
            return this.imageLabels.length > 0;
        },
    },
    methods: {
        canDelete: function (item) {
            return this.isAdmin === true || this.userId === item.user.id;
        },
        emitDeleted: function (item) {
            this.$emit('deleted', item);
        },
    }
});
