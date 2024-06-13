<template>
<li
    class="file-browser-file file-browser-label clearfix"
    :class="classObject"
    @click="handleClick($event)"
    >
    <div v-if="hasError">
        <span v-if="hasError" :title="file.name" class="text-warning">
            <i class="fa fa-exclamation-triangle"></i> {{file.name}}
        </span>
    </div>
    <div v-else>
        <span v-if="file.url">
            <a :href="file.url" :title="viewTitle">
                <i class="fa fa-file"></i> {{file.name}}
            </a>
        </span>
        <span v-else :title="file.name">
            <i v-if="hasInfo" class="fa fa-info-circle"></i>
            <i v-else class="fa fa-file"></i>
            {{ file.name }}
        </span>
    </div>

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
            type: [Object, File],
            required: true,
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
        classObject() {
            return {
                selected: this.file.selected,
                selectable: this.selectable,
            };
        },
        viewTitle() {
            return `View file ${this.file.name}`;
        },
        hasError() {
            return this.file?._status?.failed;
        },
        hasInfo() {
            return this.file?._status?.info;
        }
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
