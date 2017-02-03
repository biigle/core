/**
 * A button to open or switch a tab in a sidebar
 *
 * @type {Object}
 */
biigle.$component('core.components.sidebarButton', {
    template: '<button class="sidebar__button btn btn-default btn-lg" :class="classObject" @click="toggle" :title="tab.title">' +
        '<span v-if="open" class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>' +
        '<span v-else class="glyphicon" :class="iconClass" aria-hidden="true"></span>' +
    '</button>',
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
    },
    computed: {
        iconClass: function () {
            return 'glyphicon-' + this.tab.icon;
        },
        classObject: function () {
            return {
                active: this.open
            };
        }
    },
    methods: {
        toggle: function () {
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
