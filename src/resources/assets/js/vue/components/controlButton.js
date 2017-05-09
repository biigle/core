/**
 * A generic control button of the annotation canvas
 *
 * @type {Object}
 */
biigle.$component('annotations.components.controlButton', {
    template: '<button class="control-button btn btn-sm" :title="title" :class="buttonClass" @click="handleClick"><span class="glyphicon" :class="iconClass" aria-hidden="true"></span></button>',
    props: {
        title: {
            type: String,
            default: '',
        },
        icon: {
            type: String,
            required: true,
        },
        active: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        buttonClass: function () {
            return {
                active: this.active,
            };
        },
        iconClass: function () {
            return 'glyphicon-' + this.icon;
        },
    },
    methods: {
        handleClick: function () {
            this.$emit('click');
       },
    },
});
