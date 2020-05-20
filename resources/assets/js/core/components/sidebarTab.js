/**
 * A collapsible sidebar that can show different content "tabs"
 *
 * @type {Object}
 */
export default {
    template: '<div class="sidebar__tab" :class="classObject"><slot></slot></div>',
    data() {
        return {
            open: false
        };
    },
    props: {
        name: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            required: true
        },
        title: {
            type: String
        },
        href: {
            type: String
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        highlight: {
            default: false,
        },
    },
    computed: {
        classObject() {
            return {
                'sidebar__tab--open': this.open
            };
        },
    },
    beforeCreate() {
        this.$parent.$on('open', (name) => {
            this.open = name === this.name;
        });

        this.$parent.$on('close', () => {
            this.open = false;
        });

        this.$parent.registerTab(this);
    },
};
