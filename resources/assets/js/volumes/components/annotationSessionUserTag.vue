<script>
export default {
    emits: ['remove'],
    props: ['user'],
    computed: {
        name() {
            return this.user.firstname + ' ' + this.user.lastname;
        },
        title() {
            return 'Remove ' + this.name;
        },
    },
    methods: {
        remove() {
            this.$emit('remove', this.user);
        },
    },
};
</script>
