/**
 * A button to open or switch a tab in a sidebar
 *
 * @type {Object}
 */
export default {
    template: `<a :href="href" :disabled="disabled" class="sidebar__button btn btn-default btn-lg" :class="classObject" @click="toggle" :title="tab.title">
        <span v-if="open" :class="chevronClass" aria-hidden="true"></span>
        <span v-else :class="iconClass" aria-hidden="true"></span>
    </a>`,
    props: {
        tab: {
            type: Object,
            required: true
        },
        direction: {
            type: String,
            default: 'right',
            validator(value) {
                return value === 'left' || value === 'right';
            },
        },
    },
    computed: {
        highlightClass() {
            if (typeof this.tab.highlight === 'string') {
                return `btn-${this.tab.highlight}`;
            }

            return 'btn-info';
        },
        iconClass() {
            return `fa fa-${this.tab.icon}`;
        },
        chevronClass() {
            return `fa fa-chevron-${this.direction}`;
        },
        classObject() {
            let obj = {
                active: this.open,
            };

            if (this.tab.highlight !== false) {
                obj[this.highlightClass] = true;
            }

            return obj;
        },
        disabled() {
            return this.tab.disabled;
        },
        href() {
            return this.disabled ? null : this.tab.href;
        },
        open() {
            return this.tab.open;
        },
    },
    methods: {
        toggle(e) {
            if (this.disabled || this.href) return;

            e.preventDefault();
            if (this.open) {
                this.$parent.$emit('close', this.tab.name);
            } else {
                this.$parent.$emit('open', this.tab.name);
            }
        },
    },
};
