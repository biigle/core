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
    <typeahead
        v-model="internalValue"
        :target="inputElement"
        :data="items"
        :force-select="true"
        :limit="itemLimit"
        item-key="name"
        v-show="showTypeahead"
        >
        <template slot="item" slot-scope="props">
            <div ref="typeahead" :class="{'typeahead-scrollable':scrollable, 'typeahead': !scrollable}">
            <component
                ref="dropdown"
                :is="itemComponent"
                @click.native="emitInternalValue"
                v-for="(item, index) in props.items"
                :key="index"
                :props="props"
                :item="item"
                :item-key="moreInfo"
                :scrollable="scrollable"
                :is-label="isLabelTree"
                :active="props.activeIndex === index"
                class="typeahead-item-box"
                :class="{activeItem: props.activeIndex === index}"
                >
            </component>
            </div>
        </template>
    </typeahead>
</div>
</template>

<script>
import Typeahead from 'uiv/dist/Typeahead';
import TypeaheadItem from './typeaheadItem';

/**
 * A component that displays a typeahead to find items.
 *
 * @type {Object}
 */
export default {
    components: {
        typeahead: Typeahead,
    },
    props: {
        items: {
            type: Array,
            required: true,
        },
        placeholder: {
            type: String,
            default: 'Item name',
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        value: {
            type: String,
            default: '',
        },
        clearOnSelect: {
            type: Boolean,
            default: false,
        },
        moreInfo: {
            type: String,
            default: '',
        },
        limit: {
            type: Number,
            default: 5,
        },
        itemComponent: {
            type: Object,
            default: () => TypeaheadItem,
        },
        scrollable: {
            type: Boolean,
            default: false,
        },
        isLabelTree: {
            type: Boolean,
            default: false,
        }
    },
    data() {
        return {
            inputElement: null,
            internalValue: undefined,
            inputText: '',
            timerTask: null,
            isTyping: false,
            oldInput: '',
            selectedItemIndex: 0,
            maxItemCount: 50
        };
    },
    computed: {
        itemLimit() {
            return this.scrollable ? this.maxItemCount : this.limit
        },
        showTypeahead() {
            return !this.scollable || this.scrollable && !this.isTyping;
        }
    },
    methods: {
        clear() {
            this.internalValue = undefined;
            this.inputText = '';
        },
        emitFocus(e) {
            this.$emit('focus', e);
        },
        emitBlur(e) {
            this.$emit('blur', e);
        },
        emitInternalValue() {
            if (typeof this.internalValue === 'object') {
                this.$emit('input', this.internalValue);
                this.$emit('select', this.internalValue);
                if (this.clearOnSelect) {
                    this.clear();
                }
            }
        },
        handleArrowKeyScroll(e) {
            if (this.scrollable && this.items.length > 0) {
                const typeahead = this.$refs.typeahead;
                const scrollAmount = this.$refs.dropdown[0].$el.clientHeight;

                // Reset scroll top if selected item is hidden
                if (typeahead.scrollTop != this.selectedItemIndex * scrollAmount) {
                    typeahead.scrollTop = this.selectedItemIndex * scrollAmount;
                }

                if (e.key === 'ArrowUp' && typeahead.scrollTop >= scrollAmount && this.selectedItemIndex > 0) {
                    typeahead.scrollTop -= scrollAmount;
                    this.selectedItemIndex -= 1;
                }

                if (e.key === 'ArrowDown' && typeahead.scrollTop < typeahead.scrollHeight && this.selectedItemIndex < this.maxItemCount - 1) {
                    typeahead.scrollTop += scrollAmount;
                    this.selectedItemIndex += 1;
                }
            }
        }
    },
    watch: {
        value(value) {
            this.internalValue = value;
        },
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
    created() {
        this.internalValue = this.value;
    },
    mounted() {
        this.inputElement = this.$refs.input;
    },
};
</script>
