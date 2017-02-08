/**
 * A button to open or switch a tab in a sidebar
 *
 * @type {Object}
 */
biigle.$component('core.components.sidebarButton', {
    template: '<a :href="href" class="sidebar__button btn btn-default btn-lg" :class="classObject" @click="toggle" :title="tab.title">' +
        '<span v-if="open" class="glyphicon" :class="chevronClass" aria-hidden="true"></span>' +
        '<span v-else class="glyphicon" :class="iconClass" aria-hidden="true"></span>' +
    '</a>',
    data: function () {
        return {
            open: false
        };
    },
    props: {
        tab: {
            type: Object,
            required: true
        },
        direction: {
            type: String,
            default: 'right',
            validator: function (value) {
                return value === 'left' || value === 'right';
            },
        },
    },
    computed: {
        iconClass: function () {
            return 'glyphicon-' + this.tab.icon;
        },
        chevronClass: function () {
            return 'glyphicon-chevron-' + this.direction;
        },
        classObject: function () {
            return {
                active: this.open
            };
        },
        href: function () {
            return this.tab.href;
        },
    },
    methods: {
        toggle: function (e) {
            if (this.href) return;

            e.preventDefault();
            if (this.open) {
                this.$parent.$emit('close');
            } else {
                this.$parent.$emit('open', this.tab.name);
            }
        }
    },
    mounted: function () {
        var self = this;
        this.$parent.$on('open', function (name) {
            self.open = name === self.tab.name;
        });

        this.$parent.$on('close', function () {
            self.open = false;
        });
    }
});
