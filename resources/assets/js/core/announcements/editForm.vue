<script>
/**
 * The a form that creates a announcement
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
        if (this.$rel.bodyInput) {
            this.body = this.$rel.bodyInput.value;
        }
    },
};
</script>
