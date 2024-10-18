<template>
<li>
    <a href="#" @click.prevent="props.select(item)" :class="computedClass">
        <span v-html="props.highlight(item)"></span>
        <span v-if="info">
            <br><small class="typeahead-item-info" v-text="info" :title="info"></small>
        </span>
    </a>
</li>
</template>

<script>
export default {
    props: {
        props: {
            type: Object,
            required: true,
        },
        item: {
            type: Object,
            required: true,
        },
        itemKey: {
            type: String,
            default: '',
        },
        scrollable: {
            type: Boolean,
            default: false,
        },
        active: {
            type: Boolean,
            default: false,
        },
        isLabel:{
            type: Boolean,
            default: false,
        }
    },
    computed: {
        info() {
            if (!this.itemKey) {
                return '';
            }

            let keys = this.itemKey.split('.');

            return keys.reduce(function (i, key) {
                return i ? i[key] : i;
            }, this.item);
        },
        computedClass() {
            return {
                'scrollable-item': !this.scrollable || this.scrollable && !this.isLabel,
                'scrollable-item-label': this.scrollable && this.isLabel,
                'activeItemText': this.active
            };
        }
    }
};
</script>
