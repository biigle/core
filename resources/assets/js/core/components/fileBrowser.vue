<template>
    <div class="file-browser">
        <div v-show="hasItems" class="panel panel-default">
            <directory
                :directory="rootDirectory"
                :root="true"
                :removable="editable"
                :selectable="selectable"
                :files-selectable="filesSelectable"
                :download-url="downloadUrl"
                :expanded="expanded"
                :emptyText="emptyText"
                :expand-on-select="expandOnSelect"
                @select="emitSelect"
                @select-file="emitSelectFile"
                @unselect="emitUnselect"
                @unselect-file="emitUnselectFile"
                @remove-directory="emitRemoveDirectory"
                @remove-file="emitRemoveFile"
                @load="emitLoad"
                ></directory>
        </div>
    </div>
</template>

<script>
import Directory from './fileBrowserDirectory';

export default {
    components: {
        directory: Directory,
    },
    props: {
        rootDirectory: {
            type: Object,
            required: true,
        },
        editable: {
            type: Boolean,
            default: false,
        },
        selectable: {
            type: Boolean,
            default: false,
        },
        filesSelectable: {
            type: Boolean,
            default: false,
        },
        downloadUrl: {
            type: String,
            default: '',
        },
        expanded: {
            type: Boolean,
            default: true,
        },
        emptyText: {
            type: String,
            default: 'empty',
        },
        expandOnSelect: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            //
        };
    },
    computed: {
        hasItems() {
            return Object.keys(this.rootDirectory.directories).length > 0;
        },
    },
    methods: {
        emitSelect(directory, path) {
            this.$emit('select', directory, path);
        },
        emitUnselect(directory, path) {
            this.$emit('unselect', directory, path);
        },
        emitSelectFile(file, directory, path, event) {
            this.$emit('select-file', file, directory, path, event);
        },
        emitUnselectFile(file, directory, path, event) {
            this.$emit('unselect-file', file, directory, path, event);
        },
        emitRemoveDirectory(directory, path) {
            this.$emit('remove-directory', directory, path);
        },
        emitRemoveFile(file, path) {
            this.$emit('remove-file', file, path);
        },
        emitLoad(directory, path) {
            this.$emit('load', directory, path);
        },
    },
};
</script>
