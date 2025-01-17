<template>
    <aside class="sidebar" :class="classObject">
        <div class="sidebar__buttons" v-if="showButtons">
            <sidebar-button
                v-for="tab in tabs"
                :tab="tab"
                :key="tab.id"
                :direction="direction"
                @click="handleToggleTab"
                ></sidebar-button>
        </div>
        <div class="sidebar__tabs">
            <slot></slot>
        </div>
    </aside>
</template>

<script>
import Button from './sidebarButton.vue';
import Events from '../events.js';
import Keyboard from '../keyboard.js';

/**
 * A collapsible sidebar that can show different content "tabs"
 *
 * @type {Object}
 */
export default {
    emits: [
        'close',
        'open',
        'toggle',
    ],
    components: {
        sidebarButton: Button,
    },
    data() {
        return {
            open: false,
            tabs: [],
            lastOpenedTab: null,
            tabIdSequence: 0,
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
            validator(value) {
                return value === 'left' || value === 'right';
            },
        },
        toggleOnKeyboard: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        classObject() {
            return {
                'sidebar--open': this.open,
                'sidebar--left': this.isLeft,
                'sidebar--right': !this.isLeft,
            };
        },
        isLeft() {
            return this.direction === 'left';
        },
        // This is required by the sidebarTab child component.
        currentOpenTab() {
            return this.open ? this.lastOpenedTab : null;
        },
    },
    methods: {
        registerTab(tab) {
            tab.id = this.tabIdSequence++;
            this.tabs.push(tab);
        },
        handleToggleTab(name) {
            if (this.open && this.lastOpenedTab === name) {
                this.handleCloseTab(name);
            } else {
                this.handleOpenTab(name);
            }
        },
        handleOpenTab(name) {
            this.open = true;
            this.lastOpenedTab = name;
            this.$emit('open', name);
            this.$emit('toggle', name);
            Events.emit('sidebar.toggle', name);
            Events.emit(`sidebar.open.${name}`);
        },
        handleCloseTab(name) {
            this.open = false;
            this.$emit('close', name);
            this.$emit('toggle', name);
            Events.emit('sidebar.toggle', name);
            Events.emit(`sidebar.close.${name}`);
        },
        toggleLastOpenedTab(e) {
            if (this.open) {
                e.preventDefault();
                this.handleCloseTab(this.lastOpenedTab);
            } else if (this.lastOpenedTab) {
                e.preventDefault();
                this.handleOpenTab(this.lastOpenedTab);
            } else if (this.tabs.length > 0) {
                e.preventDefault();
                this.handleOpenTab(this.tabs[0].name);
            }
        },
    },
    watch: {
        openTab(tab) {
            this.handleOpenTab(tab);
        },
    },
    created() {
        if (this.toggleOnKeyboard) {
            Keyboard.on('Tab', this.toggleLastOpenedTab);
        }
    },
    mounted() {
        if (this.openTab) {
            this.handleOpenTab(this.openTab);
        }
    }
};
</script>
