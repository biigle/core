<script>
export default {
    data() {
        return {
            form: false,
            token: '',
        };
    },
    methods: {
        showForm() {
            this.form = true;
        },
    },
    created() {
        this.token = document.querySelector('meta[name="csrf-token"]').content;
    },
    mounted() {
        this.$refs.ht.appendChild(this.$refs.hs.firstChild);
    },
};
</script>
