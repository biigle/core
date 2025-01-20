<template>
    <a
        class="sidebar__button btn btn-default btn-lg"
        :href="href"
        :disabled="disabled"
        :class="classObject"
        :title="tab.title"
        @click="handleClick"
        >
        <span v-if="open" :class="chevronClass" aria-hidden="true"></span>
        <span v-else :class="iconClass" aria-hidden="true"></span>
    </a>
</template>

<script>
/**
 * A button to open or switch a tab in a sidebar
 *
 * @type {Object}
 */
export default {
    emits: ['click'],
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
            return this.tab.disabled ? true : null;
        },
        href() {
            return this.disabled ? null : this.tab.href;
        },
        open() {
            return this.tab.open;
        },
    },
    methods: {
        handleClick(e) {
            if (this.disabled || this.href) return;

            e.preventDefault();
            this.$emit('click', this.tab.name);
        },
    },
};
</script>
