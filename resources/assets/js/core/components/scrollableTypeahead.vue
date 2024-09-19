<template>
    <div class="typeahead clearfix">
        <input
            ref="input"
            class="form-control"
            type="text"
            v-model="inputText"
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
            :limit="50"
            item-key="name"
            v-show="!isTyping"
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

// !!!!!!!!!!!!!!TODO: fix active state + dropdown after valid input doesnt drop out !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

import uivTypeahead from 'uiv/dist/Typeahead';
import ScrollableTypeaheadItem from './scrollableTypeaheadItem.vue';
import Typeahead from './typeahead.vue';

export default {
    components: {
        uivTypeahead: uivTypeahead,
        scrollableTypeaheadItem: ScrollableTypeaheadItem,
    },
    mixins: [Typeahead],
    props: {
        itemComponent: {
            type: Object,
            default: () => ScrollableTypeaheadItem,
        }
    },
    data() {
        return {
            inputText: '',
            timerTask: null,
            isTyping: false,
        }
    },
    methods:{
        clear() {
            this.internalValue = undefined;
            this.inputText = '';
        },
    },
    watch: {
        inputText(v) {
            this.isTyping = true;
            clearTimeout(this.timerTask);

            this.timerTask = setTimeout(() => {
                if (v.length > 4) {
                    this.$emit('fetch', v);
                }
                this.isTyping = false;
            }, 500);
        }
    }
}


</script>