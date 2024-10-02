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
            @keydown.up="handleArrowKeyScroll"
            @keydown.down="handleArrowKeyScroll"
            >
        <uivTypeahead
            v-model="internalValue"
            :target="inputElement"
            :data="items"
            :force-select="true"
            :limit="maxItemCount"
            item-key="name"
            v-show="!isTyping"
            >
            <template slot="item" slot-scope="props">
                <div ref="typeahead" class="typeahead-scrollable">
                <component
                    :is="itemComponent"
                    @click.native="emitInternalValue"
                    v-for="(item, index) in props.items"
                    :key="index"
                    :props="props"
                    :item="item"
                    :item-key="moreInfo"
                    :scrollable="true"
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
import Typeahead from './typeahead.vue';
import TypeaheadItem from './typeaheadItem';

export default {
    components: {
        uivTypeahead: uivTypeahead,
    },
    mixins: [Typeahead],
    props: {
        itemComponent: {
            type: Object,
            default: () => TypeaheadItem,
        }
    },
    data() {
        return {
            inputText: '',
            timerTask: null,
            isTyping: false,
            oldInput: '',
            selectedItemIndex: 1,
            scrolledHeight: 0,
            maxItemCount: 50
        }
    },
    methods:{
        clear() {
            this.internalValue = undefined;
            this.inputText = '';
        },
        handleArrowKeyScroll(e) {
            if (this.items.length > 0) {
                const typeahead = this.$refs.typeahead;
                const scrollAmount = typeahead.scrollHeight / this.maxItemCount;
                const boxHeight = scrollAmount * 4;

                if (this.selectedItemIndex === 1) {
                    typeahead.scrollTop = 0;
                    this.scrolledHeight = boxHeight

                }

                if (e.key === 'ArrowUp' && this.selectedItemIndex > 1) {
                    this.selectedItemIndex -= 1;
                    let upperBoxBorder = (this.scrolledHeight - boxHeight);
                    if (scrollAmount * this.selectedItemIndex === upperBoxBorder) {
                        typeahead.scrollTop -= boxHeight;
                        this.scrolledHeight -= boxHeight;
                    }
                    // If selected item is not displayed any more, set scrollbar to height of selected item
                    if (typeahead.scrollTop != upperBoxBorder) {
                        typeahead.scrollTop = this.scrolledHeight - boxHeight;
                    }
                }

                if (e.key === 'ArrowDown' && this.selectedItemIndex < this.maxItemCount) {
                    if (scrollAmount * this.selectedItemIndex === this.scrolledHeight) {
                        typeahead.scrollTop += boxHeight;
                        this.scrolledHeight += boxHeight;
                    }

                    // If selected item is not displayed any more, set scrollbar to height of selected item
                    if (typeahead.scrollTop != this.scrolledHeight) {
                        typeahead.scrollTop = this.scrolledHeight - boxHeight;
                    }
                    this.selectedItemIndex += 1;
                }
            }
        }
    },
    watch: {
        inputText(v) {
            this.isTyping = true;
            clearTimeout(this.timerTask);

            this.timerTask = setTimeout(() => {
                let added = v.trim().includes(this.oldInput.trim());
                let useTypeaheadFilter = this.oldInput.length > 3 && added;
                if (v.length >= 3 && !useTypeaheadFilter) {
                    this.$emit('fetch', v);
                }
                this.isTyping = false;
                this.oldInput = v
            }, 500);
        },
        disabled() {
            // Use disabled and nextTick to show dropdown right after loading finished
            if (!this.disabled) {
                this.$nextTick(() => this.$refs.input.focus())
            }
        }
    },
}


</script>