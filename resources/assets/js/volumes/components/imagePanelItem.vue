<script>
export default {
    props: ['image'],
    computed: {
        classObject() {
            return {
                'list-group-item-success': this.image.isNew,
            };
        },
        title() {
            return 'Delete image #' + this.image.id;
        },
    },
    methods: {
        remove() {
            this.$emit('remove', this.image);
        },
    },
};
</script>
