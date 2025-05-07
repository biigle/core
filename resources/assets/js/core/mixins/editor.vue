<script>
/**
 * A mixin for view models that have an editing state
 *
 * @type {Object}
 */
export default {
    emits: [
        'editing.start',
        'editing.stop',
    ],
    data() {
        return {
            editing: false,
        };
    },
    methods: {
        startEditing() {
            this.editing = true;
            this.$emit('editing.start');
        },
        finishEditing() {
            this.editing = false;
            this.$emit('editing.stop');
        },
        toggleEditing() {
            if (this.editing) {
                this.finishEditing();
            } else {
                this.startEditing();
            }
        },
    },
};
</script>
