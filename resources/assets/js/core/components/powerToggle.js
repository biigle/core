/**
 * A generic on/off button
 *
 * @type {Object}
 */
biigle.$component('core.components.powerToggle', {
    template: '<span class="power-toggle"><button type="button" class="btn btn-default" :class="objectClass" @click="handleClick" :title="currentTitle"><i class="fa fa-power-off"></i></button><span v-if="label" class="power-toggle__label" v-text="label"></span></span>',
    props: {
        active: {
            type: Boolean,
            required: true,
        },
        title: {
            type: String,
            default: '',
        },
        titleOn: {
            type: String,
            default: '',
        },
        titleOff: {
            type: String,
            default: '',
        },
        type: {
            type: String,
            default: 'info',
        },
    },
    computed: {
        currentTitle: function () {
            if (this.active) {
                return this.titleOn || this.title;
            }

            return this.titleOff || this.title;
        },
        label: function () {
            return this.$slots.default ? this.$slots.default[0].text : '';
        },
        objectClass: function () {
            var obj = {active: this.active};
            obj['btn-' + this.type] = this.active;

            return obj;
        },
    },
    methods: {
        handleClick: function () {
            if (this.active) {
                this.$emit('off');
            } else {
                this.$emit('on');
            }
        },
    },
});
