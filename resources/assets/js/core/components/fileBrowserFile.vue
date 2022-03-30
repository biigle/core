<template>
<li
    class="file-browser-file clearfix"
    :class="classObject"
    >
    <a
        v-if="downloadUrl"
        :href="fullDownloadUrl"
        title="View file"
        >
        <i class="fa fa-file"></i> {{file.name}}
    </a>
    <span v-else>
        <i class="fa fa-file"></i> {{file.name}}
    </span>

    <button
        v-if="removable"
        class="btn btn-default btn-xs pull-right"
        title="Remove the file"
        @click.stop="emitRemove"
        >
        <i class="fa fa-trash"></i>
    </button>
</li>
</template>

<script>
export default {
    props: {
        file: {
            type: Object,
            required: true,
        },
        downloadUrl: {
            type: String,
            default: '',
        },
        dirname: {
            type: String,
            default: '/',
        },
        removable: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        fullDownloadUrl() {
            // Remove leading slash.
            let path = this.dirname.slice(1) + '/' + this.file.name;

            return this.downloadUrl + '?path=' + encodeURIComponent(path);
        },
        classObject() {
            return {
                selected: this.file.selected,
            };
        },
    },
    methods: {
        emitRemove() {
            this.$emit('remove', this.file);
        },
    },
};
</script>
