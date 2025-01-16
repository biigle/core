<template>
    <span class="power-toggle">
        <button
            type="button"
            class="btn btn-default"
            :class="objectClass"
            :title="currentTitle"
            :disabled="disabled"
            @click="handleClick"
            >
            <i class="fa fa-fw" :class="iconClass"></i>
        </button>
        <span v-if="$slots.default" class="power-toggle__label">
            <slot></slot>
        </span>
    </span>
</template>

<script>
/**
 * A generic on/off button
 *
 * @type {Object}
 */
export default {
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
        disabled: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        currentTitle() {
            if (this.active) {
                return this.titleOn || this.title;
            }

            return this.titleOff || this.title;
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
</script>
