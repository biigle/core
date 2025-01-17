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
        >
    <typeahead
        v-show="showTypeahead"
        v-model="internalValue"
        :target="inputElement"
        :data="items"
        :force-select="true"
        :limit="itemLimit"
        :class="{'typeahead-scrollable': scrollable}"
        item-key="name"
        @selected-item-changed="handleArrowKeyScroll"
        >
          <template #item="{ items, activeIndex, select, highlight }">
            <component
                :is="itemComponent"
                ref="dropdown"
                v-for="(item, index) in items"
                :key="index"
                :class="{active: activeIndex === index}"
                :item="item"
                :item-key="moreInfo"
                :select="select"
                :highlightHtml="highlight(item)"
                >
            </component>
        </template>
    </typeahead>
</div>
</template>

<script>
import TypeaheadItem from './typeaheadItem.vue';
import {debounce} from '../utils.js';
import {Typeahead} from 'uiv';

/**
 * A component that displays a typeahead to find items.
 *
 * @type {Object}
 */
export default {
    emits: [
        'blur',
        'fetch',
        'focus',
        'input',
        'select',
    ],
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
    },
    data() {
        return {
            inputElement: null,
            internalValue: undefined,
            inputText: '',
            isTyping: false,
            oldInput: '',
            maxItemCount: 50
        };
    },
    computed: {
        itemLimit() {
            return this.scrollable ? this.maxItemCount : this.limit
        },
        showTypeahead() {
            return !this.scrollable || this.scrollable && !this.isTyping;
        },
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
        handleArrowKeyScroll(index) {
            if (this.scrollable && this.$refs.dropdown[index]) {
                this.$refs.dropdown[index].$el.scrollIntoView({block: 'nearest'});
            }
        },
    },
    watch: {
        value(value) {
            this.internalValue = value;
        },
        inputText(v) {
            this.isTyping = true;
            debounce(() => {
                let added = v.trim().includes(this.oldInput.trim());
                let useTypeaheadFilter = this.oldInput.length > 3 && added;
                if (v.length >= 3 && !useTypeaheadFilter) {
                    this.$emit('fetch', v);
                }
                this.isTyping = false;
                this.oldInput = v
            }, 500, 'typeahead-fetch');
        },
        disabled() {
            // Use disabled and nextTick to show dropdown right after loading finished
            if (!this.disabled) {
                this.$nextTick(() => this.$refs.input.focus())
            }
        },
        internalValue(value) {
            if (typeof value === 'object') {
                this.$emit('input', value);
                this.$emit('select', value);
                if (this.clearOnSelect) {
                    this.clear();
                }
            }
        },
    },
    created() {
        this.internalValue = this.value;
    },
    mounted() {
        this.inputElement = this.$refs.input;
    },
};
</script>
