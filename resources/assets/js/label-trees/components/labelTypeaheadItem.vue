<template>
<li>
    <a href="#" @click.prevent="select(item)">
        <div class="label-typeahead-item">
            <span v-if="item.color" :style="{'background-color': '#' + item.color}" class="label-color"></span>
            <span v-html="highlightHtml"></span>
            <span v-if="info">
                <br><small class="typeahead-item-info" v-text="info" :title="info"></small>
            </span>
        </div>
    </a>
</li>
</template>

<script>
import TypeaheadItem from '@/core/components/typeaheadItem.vue';

export default {
    mixins: [TypeaheadItem],
};
</script>
