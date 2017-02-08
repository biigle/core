/**
 * A collapsible sidebar that can show different content "tabs"
 *
 * @type {Object}
 */
biigle.$component('core.components.sidebar', {
    template: '<aside class="sidebar" :class="classObject">' +
        '<div class="sidebar__buttons" v-if="showButtons">' +
            '<sidebar-button v-for="tab in tabs" :tab="tab" :direction="direction"></sidebar-button>' +
        '</div>' +
        '<div class="sidebar__tabs"><slot name="tabs"></slot></div>' +
    '</aside>',
    components: {
        sidebarButton: biigle.$require('core.components.sidebarButton'),
    },
    data: function () {
        return {
            open: false
        };
    },
    props: {
        openTab: {
            type: String
        },
        showButtons: {
            type: Boolean,
            default: true,
        },
        // Indicates whether the sidebar is on the 'left' or on the 'right'
        direction: {
            type: String,
            default: 'right',
            validator: function (value) {
                return value === 'left' || value === 'right';
            },
        },
    },
    computed: {
        classObject: function () {
            return {
                'sidebar--open': this.open,
                'sidebar--left': this.isLeft,
                'sidebar--right': !this.isLeft,
            };
        },
        tabs: function () {
            var tabs = [];
            for (var i = this.$slots.tabs.length - 1; i >= 0; i--) {
                tabs.unshift(this.$slots.tabs[i].componentOptions.propsData);
            }

            return tabs;
        },
        isLeft: function () {
            return this.direction === 'left';
        },
    },
    created: function () {
        var self = this;
        this.$on('open', function () {
            this.open = true;
            this.$emit('toggle');
        });

        this.$on('close', function () {
            this.open = false;
            this.$emit('toggle');
        });
    },
    mounted: function () {
        if (this.openTab) {
            this.$emit('open', this.openTab);
        }
    }
});
