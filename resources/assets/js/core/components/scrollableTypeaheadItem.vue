<template>
    <li>
        <a id="scrollable-item" href="#" @click.prevent="props.select(item)">
            <span v-html="props.highlight(item)"></span>
            <span v-if="info">
                <br><small class="typeahead-item-info" v-text="info" :title="info"></small>
            </span>
        </a>
    </li>
    </template>

<script>
import typeaheadItem from './typeaheadItem.vue';


export default{
    mixins: [typeaheadItem]
}
</script>