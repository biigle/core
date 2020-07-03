<script>
export default {
    computed: {
        patchPrefix() {
            return this.uuid[0] + this.uuid[1] + '/' + this.uuid[2] + this.uuid[3] + '/' + this.uuid;
        },
    },
    methods: {
        getUrl() {
            return this.urlTemplate
                .replace(':prefix', this.patchPrefix)
                .replace(':id', this.id);
        },
    },
};
</script>
