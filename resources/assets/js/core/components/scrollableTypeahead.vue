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
                    :active="props.activeIndex === index"
                    class="typeahead-item-box"
                    :class="{activeItem: props.activeIndex === index}"
                    >
                </component>
                </div>
            </template>
        </uivTypeahead>
    </div>
</template>

<script>

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
        },
        disabled() {
            // Use disabled and nextTick to show dropdown right after loading finished
            if (!this.disabled) {
                this.$nextTick(() => this.$refs.input.focus())
            }
        }
    }
}


</script>