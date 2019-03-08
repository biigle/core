biigle.$component('largo.mixins.annotationPatch', {
    computed: {
        patchPrefix: function () {
            return this.uuid[0] + this.uuid[1] + '/' + this.uuid[2] + this.uuid[3] + '/' + this.uuid;
        },
    },
    methods: {
        getUrl: function () {
            return this.urlTemplate
                .replace(':prefix', this.patchPrefix)
                .replace(':id', this.id);
        },
    },
});
