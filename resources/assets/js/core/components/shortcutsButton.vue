<template>
    <div>
        <button 
            class="btn btn-default"
            type="button"
            @click="openKeyboardShortcutsModal"
            title="Show keyboard shortcuts"
        >
            <span class="fa fa-keyboard" aria-hidden="true"></span>
            <span> Shortcuts</span>
        </button>

        <teleport to="body">
            <div v-if="showKeyboardShortcutsModal">
                <div
                    class="modal in settings-tab__shortcuts-modal"
                    tabindex="-1"
                    role="dialog"
                    @click.self="closeKeyboardShortcutsModal"
                >
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <button
                                    type="button"
                                    class="close"
                                    @click="closeKeyboardShortcutsModal"
                                    aria-label="Close"
                                >
                                    <span aria-hidden="true">&times;</span>
                                </button>
                                <h4 class="modal-title">
                                    Keyboard shortcuts
                                </h4>
                            </div>

                            <div class="modal-body">
                                <slot></slot>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    class="modal-backdrop in"
                    @click="closeKeyboardShortcutsModal"
                ></div>
            </div>
        </teleport>
    </div>
</template>

<script>
export default {
    data() {
        return {
            showKeyboardShortcutsModal: false,
        };
    },
    methods: {
        openKeyboardShortcutsModal() {
            this.showKeyboardShortcutsModal = true;
        },
        closeKeyboardShortcutsModal() {
            this.showKeyboardShortcutsModal = false;
        },
    },
};
</script>