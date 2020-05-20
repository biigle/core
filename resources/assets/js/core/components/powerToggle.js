/**
 * A generic on/off button
 *
 * @type {Object}
 */
export default {
    template: `<span class="power-toggle">
        <button type="button" class="btn btn-default" :class="objectClass" @click="handleClick" :title="currentTitle">
            <i class="fa fa-fw" :class="iconClass"></i>
        </button>
        <span v-if="label" class="power-toggle__label" v-text="label"></span>
    </span>`,
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
        icon: {
            type: String,
            default: 'power-off',
        },
    },
    computed: {
        currentTitle() {
            if (this.active) {
                return this.titleOn || this.title;
            }

            return this.titleOff || this.title;
        },
        label() {
            return this.$slots.default ? this.$slots.default[0].text : '';
        },
        objectClass() {
            let obj = {active: this.active};
            obj[`btn-${this.type}`] = this.active;

            return obj;
        },
        iconClass() {
            return `fa-${this.icon}`;
        },
    },
    methods: {
        handleClick() {
            if (this.active) {
                this.$emit('off');
            } else {
                this.$emit('on');
            }
        },
    },
};
