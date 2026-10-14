<template>
    <button 
        class="btn btn-default btn-block"
        type="button"
        @click="openKeyboardShortcutsModal"
        title="Show keyboard shortcuts"
    >
        <span class="fa fa-keyboard" aria-hidden="true"></span>
        <span> Available shortcuts</span>
    </button>
    
    <modal 
        v-model="showKeyboardShortcutsModal"
        title="Keyboard shortcuts"
        :footer="false"
        append-to-body>
            <slot></slot>
    </modal>
</template>

<script>
import { Modal } from 'uiv';
import Keyboard from '@/core/keyboard.js';

export default {
    components: {
        modal: Modal,
    },
    data() {
        return {
            keyboardOffCallbacks: [],
            showKeyboardShortcutsModal: false,
        };
    },
    methods: {
        openKeyboardShortcutsModal() {
            this.showKeyboardShortcutsModal = true;
        }
    },
    watch: {
        showKeyboardShortcutsModal(show) {
            if (show) {
                Keyboard.disable();
            } else {
                Keyboard.enable();
            }
        }
    },
    created() {
        this.keyboardOffCallbacks.push(
            Keyboard.on('F1', this.openKeyboardShortcutsModal),
            Keyboard.on('q', this.openKeyboardShortcutsModal),
        );
    },
    beforeUnmount() {
        this.keyboardOffCallbacks.forEach(off => off());
        Keyboard.enable();
    }
};
</script>