<div v-if="showKeyboardShortcutsModal"
    class="modal in settings-tab__shortcuts-modal"
    tabindex="-1"
    role="dialog"
    @click.self="closeKeyboardShortcutsModal">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" @click="closeKeyboardShortcutsModal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                <h4 class="modal-title" id="keyboard-shortcuts-label">Keyboard shortcuts</h4>
            </div>
            <div class="modal-body">
                @include($shortcutsPartial)
            </div>
        </div>
    </div>
</div>

<div v-if="showKeyboardShortcutsModal"
    class="modal-backdrop in"
    @click="closeKeyboardShortcutsModal"></div>