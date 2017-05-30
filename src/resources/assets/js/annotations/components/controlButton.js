/**
 * A generic control button of the annotation canvas
 *
 * @type {Object}
 */
biigle.$component('annotations.components.controlButton', {
    template: '<button class="control-button btn" :title="title" :class="buttonClass" @click="handleClick"><i :class="iconClass" aria-hidden="true"></i></button>',
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
            if (this.icon.startsWith('glyphicon-')) {
                return 'glyphicon ' + this.icon;
            } else if (this.icon.startsWith('fa-')) {
                return 'fa ' + this.icon;
            }

            return 'icon icon-white ' + this.icon;
        },
    },
    methods: {
        handleClick: function () {
            this.$emit('click');
       },
    },
});
