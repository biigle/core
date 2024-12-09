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
import Settings from '../stores/settings';
import {PowerToggle} from '../import';

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
            buttonWasClicked: true,
        };
    },
    inject: ['outlines'],
    computed: {
        settings() {
            return Settings;
        },
        showAnnotationOutlines() {
            return this.outlines.showAnnotationOutlines;
        },
    },
    methods: {
        enableOutlines() {
            this.buttonWasClicked = true;
            this.showOutlines = true;
        },
        disableOutlines() {
            this.buttonWasClicked = true;
            this.showOutlines = false;
        },
    },
    watch: {
        showOutlines(show) {
            if (this.buttonWasClicked) {
                this.$emit('change-outlines', show);
                this.settings.set('showOutlines', show);
            }
        },
        showAnnotationOutlines() {
            this.buttonWasClicked = false;
            this.showOutlines = this.showAnnotationOutlines;
        },
    },
    created() {
        this.restoreKeys.forEach((key) => {
            this[key] = this.settings.get(key);
        });
    },
};
</script>

