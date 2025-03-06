<template>
    <div class="sidebar__tab" :class="classObject">
        <slot></slot>
    </div>
</template>

<script>
/**
 * A collapsible sidebar that can show different content "tabs"
 *
 * @type {Object}
 */
export default {
    data() {
        return {
            id: null,
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
        open() {
            return this.$parent.currentOpenTab === this.name;
        },
    },
    beforeCreate() {
        this.$parent.registerTab(this);
    },
};
</script>
