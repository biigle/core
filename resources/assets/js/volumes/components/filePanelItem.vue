<script>
export default {
    emits: ['remove'],
    props: ['file', 'type'],
    computed: {
        classObject() {
            return {
                'list-group-item-success': this.file.isNew,
            };
        },
        title() {
            return `Delete ${this.type} #${this.file.id}`;
        },
    },
    methods: {
        remove() {
            this.$emit('remove', this.file);
        },
    },
};
</script>
