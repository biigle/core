<script>
/**
 * The a form that edits/creates a system message
 */
// Set the initial content of the textarea to the 'body' model and then clear the
// textarea before initializing Vue. Else Vue will complain that v-model does not
// support initial inline data although we want to have it from a possible failed
// validation.

export default {
    data() {
        return {
            body: '',
        };
    },
    beforeMount() {
        let element = document.getElementById('system-messages-edit-form');
        let textarea = element.querySelector('textarea[name="body"]');
        if (textarea) {
            this.body = textarea.value;
        }
    },
};
</script>
