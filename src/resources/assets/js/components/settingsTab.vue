<template>
    <div class="settings-tab">
        <div class="largo-tab__button">
            <power-toggle
                :active="showOutlines"
                @on="enableOutlines"
                @off="disableOutlines"
                >
                Show annotation outlines
            </power-toggle>
        </div>
    </div>
</template>

<script>
import Settings from '../stores/settings.js';
import {PowerToggle} from '../import.js';
import { Keyboard } from '../import.js';

export default {
    components: {
        PowerToggle
    },
    data() {
        return {
            restoreKeys: [
                'showOutlines',
            ],
            showOutlines: true,
        };
    },
    computed: {
        settings() {
            return Settings;
        },
    },
    methods: {
        enableOutlines() {
            this.showOutlines = true;
        },
        disableOutlines() {
            this.showOutlines = false;
        },
    },
    watch: {
        showOutlines(show) {
            this.$emit('change-outlines', show);
            this.settings.set('showOutlines', show);
        },
    },
    created() {
        this.restoreKeys.forEach((key) => {
            this[key] = this.settings.get(key);
        });

        Keyboard.on('o', () => {
            if (this.showOutlines) {
                this.disableOutlines();
            } else {
                this.enableOutlines();
            }
        });
    },
};
</script>

