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
        '<div class="sidebar__tabs"><slot></slot></div>' +
    '</aside>',
    components: {
        sidebarButton: biigle.$require('core.components.sidebarButton'),
    },
    data: function () {
        return {
            open: false,
            tabs: [],
            lastOpenedTab: null,
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
        toggleOnKeyboard: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        events: function () {
            return biigle.$require('events');
        },
        classObject: function () {
            return {
                'sidebar--open': this.open,
                'sidebar--left': this.isLeft,
                'sidebar--right': !this.isLeft,
            };
        },
        isLeft: function () {
            return this.direction === 'left';
        },
    },
    methods: {
        registerTab: function (tab) {
            this.tabs.push(tab);
        },
        handleOpenTab: function (name) {
            this.open = true;
            this.lastOpenedTab = name;
            this.$emit('toggle', name);
            this.events.$emit('sidebar.toggle', name);
            this.events.$emit('sidebar.open.' + name);
        },
        handleCloseTab: function (name) {
            this.open = false;
            this.$emit('toggle', name);
            this.events.$emit('sidebar.toggle', name);
            this.events.$emit('sidebar.close.' + name);
        },
        toggleLastOpenedTab: function (e) {
            if (this.lastOpenedTab) {
                e.preventDefault();
                if (this.open) {
                    this.$emit('close', this.lastOpenedTab);
                } else {
                    this.$emit('open', this.lastOpenedTab);
                }
            }
        },
    },
    created: function () {
        this.$on('open', this.handleOpenTab);
        this.$on('close', this.handleCloseTab);

        if (this.toggleOnKeyboard) {
            biigle.$require('core.keyboard').on(9, this.toggleLastOpenedTab);
        }
    },
    mounted: function () {
        if (this.openTab) {
            this.$emit('open', this.openTab);
        }
    }
});
