<template>
    <span
        class="control-button btn"
        :title="title"
        :class="classObject"
        :disabled="disabled || null"
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
            <slot @active="updateActiveSubControls"></slot>
        </span>
        <span
            v-if="showTooltip"
            title=""
            class="control-button__tooltip popover top"
            >
            <div class="arrow"></div>
            <div class="popover-content">
                <span v-text="tooltip"></span>
                <button
                    v-if="tooltipClosable"
                    type="button"
                    class="close"
                    @click.stop="closeTooltip"
                    title="Hide the tooltip"
                    >
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        </span>
    </span>
</template>

<script>
import Loader from '@/core/components/loader.vue';

/**
 * A generic control button of the annotation canvas
 *
 * @type {Object}
 */
export default {
    emits: [
        'active',
        'click',
    ],
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
        // Text content for the tooltip shown when button is active.
        tooltip: {
            type: String,
            default: '',
        },
        // Unique key for a closable tooltip. When provided, tooltip shows a close button.
        tooltipClosable: {
            type: String,
            default: '',
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
            tooltipDismissed: false,
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
        showTooltip() {
            return this.active && this.tooltip && !this.tooltipDismissed;
        },
        tooltipClosableKey() {
            return 'tooltip-dismissed-' + this.tooltipClosable;
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
        },
        closeTooltip() {
            this.tooltipDismissed = true;
            if (this.tooltipClosable) {
                window.localStorage.setItem(this.tooltipClosableKey, true);
            }
        },
    },
    watch: {
        active: {
            immediate: true,
            handler(active) {
                this.$emit('active', active);
            },
        },
    },
    created() {
        if (this.tooltipClosable) {
            let dismissed = window.localStorage.getItem(this.tooltipClosableKey);
            this.tooltipDismissed = dismissed ?? false;
        }
    },
};
</script>
