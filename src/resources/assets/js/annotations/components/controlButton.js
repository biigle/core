/**
 * A generic control button of the annotation canvas
 *
 * @type {Object}
 */
biigle.$component('annotations.components.controlButton', {
    template: '<span class="control-button btn" :title="title" :class="classObject" @click="handleClick" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave" :disabled="disabled">' +
        '<i :class="iconClass" aria-hidden="true"></i>' +
        '<span v-if="hasSubControls" @click.stop class="control-button__sub-controls btn-group">' +
            '<slot></slot>' +
        '</span>' +
    '</span>',
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
    },
    data: function () {
        return {
            mouseOver: false,
            timeout: null,
            activeSubControls: 0,
        };
    },
    computed: {
        classObject: function () {
            return {
                active: this.active,
                'control-button--open': this.showSubControls,
            };
        },
        iconClass: function () {
            if (this.icon.startsWith('fa-')) {
                return 'fa fa-fw ' + this.icon;
            }

            return 'icon icon-white ' + this.icon;
        },
        hasSubControls: function () {
            return this.$slots.hasOwnProperty('default');
        },
        showSubControls: function () {
            return this.mouseOver || this.hasActiveSubControl || this.open;
        },
        hasActiveSubControl: function () {
            return this.activeSubControls > 0;
        },
    },
    methods: {
        handleClick: function () {
            if (!this.disabled) {
                this.$emit('click');
            }
        },
        handleMouseEnter: function () {
            if (!this.disabled && this.hover) {
                this.mouseOver = true;
            }
            window.clearTimeout(this.timeout);
        },
        handleMouseLeave: function () {
            var self = this;
            window.clearTimeout(this.timeout);
            this.timeout = window.setTimeout(function () {
                self.mouseOver = false;
            }, 200);
        },
        updateActiveSubControls: function (active) {
            if (active) {
                this.activeSubControls += 1;
            } else {
                this.activeSubControls = Math.max(0, this.activeSubControls - 1);
            }
        }
    },
    watch: {
        active: function (active) {
            this.$parent.$emit('control-button-active', active);
        },
    },
    created: function () {
        this.$on('control-button-active', this.updateActiveSubControls);
    },
    mounted: function () {
        if (this.active) {
            this.$parent.$emit('control-button-active', true);
        }
    },
});
