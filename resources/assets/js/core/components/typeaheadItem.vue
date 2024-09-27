<template>
<li>
    <a href="#" @click.prevent="props.select(item)" :class="{'scrollable-item': scrollable, activeItemText: active}">
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
        }
    },
    watch: {
        scrollable(){
            console.log(this.scrollable);
            
        }
    }
};
</script>
