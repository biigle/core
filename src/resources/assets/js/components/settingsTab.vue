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
import {PowerToggle} from '../import';

export default {
    components: {
        PowerToggle
    },
    data() {
        return {
            showOutlines: true,
        };
    },
    computed: {
        //
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
        },
    }
};
</script>

