<template>
<li>
    <a href="#" @click.prevent="select(item)">
        <span class="typeahead-item-name" v-html="highlightHtml" :title="item.name"></span>
        <span v-if="info">
            <br><small class="typeahead-item-info" v-text="info" :title="info"></small>
        </span>
    </a>
</li>
</template>

<script>
export default {
    props: {
        select: {
            type: Function,
            required: true,
        },
        highlightHtml: {
            type: String,
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
    },
};
</script>
