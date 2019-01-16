/**
 * A generic control button of the video screen
 *
 * @type {Object}
 */
biigle.$component('components.controlButton', {
    template: '<span class="control-button btn" :title="title" :class="classObject" @click="handleClick" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">' +
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
            return this.mouseOver || this.hasActiveSubControl;
        },
        hasActiveSubControl: function () {
            return this.activeSubControls > 0;
        },
    },
    methods: {
        handleClick: function () {
            this.$emit('click');
        },
        handleMouseEnter: function () {
            this.mouseOver = true;
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
                this.activeSubControls++;
            } else {
                this.activeSubControls--;
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
});
