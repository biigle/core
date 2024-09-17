<template>
    <div class="typeahead clearfix">
        <input
            ref="input"
            class="form-control"
            type="text"
            :disabled="disabled"
            :placeholder="placeholder"
            @focus="emitFocus"
            @blur="emitBlur"
            @keyup.enter="emitInternalValue"
            >
        <uivTypeahead
            v-model="internalValue"
            :target="inputElement"
            :data="items"
            :force-select="true"
            :limit="items.length"
            item-key="name"
            >
            <template slot="item" slot-scope="props">
                <div class="typeahead-scrollable">
                <component
                    :is="itemComponent"
                    @click.native="emitInternalValue"
                    v-for="(item, index) in props.items"
                    :key="index"
                    :props="props"
                    :item="item"
                    :item-key="moreInfo"
                    class="typeahead-item-box"
                    :class="{active: props.activeIndex === index}"
                    >
                </component>
                </div>
            </template>
        </uivTypeahead>
    </div>
    </template>

<script>

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! TODO: fix active state !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

import uivTypeahead from 'uiv/dist/Typeahead';
import ScrollableTypeaheadItem from './scrollableTypeaheadItem.vue';
import Typeahead from './typeahead.vue';

export default{
    components: {
        uivTypeahead: uivTypeahead,
        scrollableTypeaheadItem: ScrollableTypeaheadItem,
    },
    mixins: [Typeahead],
    props:{
        itemComponent:{
            type: Object,
            default: () => ScrollableTypeaheadItem,
        }
    }
}


</script>