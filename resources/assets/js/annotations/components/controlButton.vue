<template>
    <span
        class="control-button btn"
        :title="title"
        :class="classObject"
        :disabled="disabled"
        @click="handleClick"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        >
        <loader v-if="loading" :active="true"></loader>
        <i v-else :class="iconClass" aria-hidden="true"></i>
        <span
            v-if="hasSubControls"
            @click.stop class="control-button__sub-controls btn-group"
            >
            <slot></slot>
        </span>
    </span>
</template>

<script>
import Loader from '../../core/components/loader';

/**
 * A generic control button of the annotation canvas
 *
 * @type {Object}
 */
export default {
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
        disabled: {
            type: Boolean,
            default: false,
        },
        // Allow opening of the sub controls on mouseover.
        hover: {
            type: Boolean,
            default: true,
        },
        // Open the sub controls.
        open: {
            type: Boolean,
            default: false,
        },
        loading: {
            type: Boolean,
            default: false,
        },
    },
    components: {
        Loader,
    },
    data() {
        return {
            mouseOver: false,
            timeout: null,
            activeSubControls: 0,
        };
    },
    computed: {
        classObject() {
            return {
                active: this.active,
                'control-button--open': this.showSubControls,
            };
        },
        iconClass() {
            if (this.icon.startsWith('fa-')) {
                return 'fa fa-fw ' + this.icon;
            }

            return 'icon icon-white ' + this.icon;
        },
        hasSubControls() {
            return this.$slots.hasOwnProperty('default');
        },
        showSubControls() {
            return this.mouseOver || this.hasActiveSubControl || this.open;
        },
        hasActiveSubControl() {
            return this.activeSubControls > 0;
        },
    },
    methods: {
        handleClick() {
            if (!this.disabled) {
                this.$emit('click');
            }
        },
        handleMouseEnter() {
            if (!this.disabled && this.hover) {
                this.mouseOver = true;
            }
            window.clearTimeout(this.timeout);
        },
        handleMouseLeave() {
            window.clearTimeout(this.timeout);
            this.timeout = window.setTimeout(() => {
                this.mouseOver = false;
            }, 200);
        },
        updateActiveSubControls(active) {
            if (active) {
                this.activeSubControls += 1;
            } else {
                this.activeSubControls = Math.max(0, this.activeSubControls - 1);
            }
        }
    },
    watch: {
        active(active) {
            this.$parent.$emit('control-button-active', active);
        },
    },
    created() {
        this.$on('control-button-active', this.updateActiveSubControls);
    },
    mounted() {
        if (this.active) {
            this.$parent.$emit('control-button-active', true);
        }
    },
};
</script>
