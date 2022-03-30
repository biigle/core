<template>
    <div
        class="file-browser-directory"
        :class="classObject"
        >
        <div
            v-if="!root"
            class="file-browser-directory-name clearfix"
            @click="handleClick"
            >

            <loader v-if="loading" :active="true"></loader>
            <span v-else>
                <i
                    v-if="collapsed"
                    class="fa fa-angle-right fa-fw collapse-caret"
                    title="Expand this directory"
                    @click.stop="handleUncollapse"
                    ></i>
                <i
                    v-else
                    class="fa fa-angle-down fa-fw collapse-caret"
                    title="Collapse this directory"
                    @click.stop="handleCollapse"
                    ></i>
            </span>

            <i class="fa fa-folder"></i> {{path}}

            <button
                v-if="removable"
                class="btn btn-default btn-xs pull-right"
                title="Remove the directory"
                @click.stop="handleRemoveDirectory"
                >
                <i class="fa fa-trash"></i>
            </button>
        </div>
        <ul
            v-show="!collapsed"
            class="file-browser-directory-list"
            >
            <li v-for="(dir, path) in directory.directories">
                <file-browser-directory
                    :path="path"
                    :dirname="fullPath"
                    :directory="dir"
                    :removable="removable"
                    :selectable="selectable"
                    :download-url="downloadUrl"
                    :expanded="expanded"
                    :empty-text="emptyText"
                    :expand-on-select="expandOnSelect"
                    @select="emitSelect"
                    @unselect="emitUnselect"
                    @remove-directory="emitRemoveDirectory"
                    @remove-file="emitRemoveFile"
                    @load="emitLoad"
                    ></file-browser-directory>
            </li>
            <file-browser-file
                v-for="(file, index) in directory.files"
                :key="index"
                :file="file"
                :download-url="downloadUrl"
                :dirname="fullPath"
                :removable="removable"
                @remove="handleRemoveFile"
                >
            </file-browser-file>
        </ul>
    </div>
</template>

<script>
import FileComponent from './fileBrowserFile';
import LoaderComponent from './loader';

export default {
    name: 'file-browser-directory',
    props: {
        path: {
            type: String,
            default: '',
        },
        dirname: {
            type: String,
            default: '/',
        },
        directory: {
            type: Object,
            required: true,
        },
        root: {
            type: Boolean,
            default: false,
        },
        removable: {
            type: Boolean,
            default: false,
        },
        selectable: {
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
    components: {
        loader: LoaderComponent,
        fileBrowserFile: FileComponent,
    },
    data() {
        return {
            collapsedInternal: true,
        };
    },
    computed: {
        classObject() {
            return {
                selected: this.selected,
                root: this.root,
                selectable: this.selectable,
            };
        },
        hasItems() {
            return this.directory.files.length > 0 || Object.keys(this.directory.directories).length > 0;
        },
        fullPath() {
            if (this.dirname === '/') {
                return '/' + this.path;
            }

            return this.dirname + '/' + this.path;
        },
        loaded() {
            return !this.directory.hasOwnProperty('loaded') || this.directory.loaded;
        },
        loading() {
            return this.directory.loading === true;
        },
        collapsed() {
            return this.collapsedInternal || !this.loaded;
        },
        selected() {
            return this.directory.selected;
        },
    },
    methods: {
        emitSelect(directory, path) {
            this.$emit('select', directory, path);
        },
        emitUnselect(directory, path) {
            this.$emit('unselect', directory, path);
        },
        handleClick() {
            if (!this.selectable) {
                return;
            }

            if (this.selected) {
                this.emitUnselect(this.directory, this.fullPath);
            } else {
                this.emitSelect(this.directory, this.fullPath);
            }
        },
        emitRemoveDirectory(directory, path) {
            this.$emit('remove-directory', directory, path);
        },
        handleRemoveDirectory() {
            if (this.removable) {
                this.emitRemoveDirectory(this.directory, this.fullPath);
            }
        },
        emitRemoveFile(file, path) {
            this.$emit('remove-file', file, path);
        },
        handleRemoveFile(file) {
            this.emitRemoveFile(file, this.fullPath);
        },
        handleCollapse() {
            this.collapsedInternal = true;
        },
        emitLoad(directory, path) {
            this.$emit('load', directory, path);
        },
        handleUncollapse() {
            if (!this.loaded) {
                this.emitLoad(this.directory, this.fullPath);
            }

            this.collapsedInternal = false;
        },
    },
    watch: {
        hasItems(hasItems) {
            if (!hasItems) {
                this.collapsedInternal = false;
            }
        },
        selected(selected) {
            if (selected && this.expandOnSelect) {
                this.collapsedInternal = false;
            }
        },
    },
    created() {
        if (this.root || this.expanded) {
            this.collapsedInternal = false;
        }
    },
};
</script>
