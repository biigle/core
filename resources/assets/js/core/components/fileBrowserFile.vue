<template>
<li
    class="file-browser-file clearfix"
    :class="classObject"
    @click="handleClick($event)"
    >
    <a
        v-if="downloadUrl"
        :href="fullDownloadUrl"
        :title="viewTitle"
        >
        <i class="fa fa-file"></i> {{file.name}}
    </a>
    <span v-else :title="file.name">
        <i class="fa fa-file"></i> {{file.name}}
    </span>

    <button
        v-if="removable"
        class="btn btn-default btn-xs remove-button"
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
        selectable: {
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
                selectable: this.selectable,
            };
        },
        viewTitle() {
            return `View file ${this.file.name}`;
        },
    },
    methods: {
        emitRemove() {
            this.$emit('remove', this.file);
        },
        handleClick(event) {
            if (!this.selectable) {
                return;
            }

            if (this.file.selected) {
                this.$emit('unselect', this.file, event);
            } else {
                this.$emit('select', this.file, event);
            }
        },
    },
};
</script>
