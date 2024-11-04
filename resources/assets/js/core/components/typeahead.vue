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
    <typeahead
        v-model="internalValue"
        :target="inputElement"
        :data="items"
        :force-select="true"
        :limit="itemLimit"
        :class="{'typeahead-scrollable': scrollable}"
        item-key="name"
        v-show="showTypeahead"
        @selected-item-changed="handleArrowKeyScroll"
        >
        <template slot="item" slot-scope="props">
            <component
                ref="dropdown"
                :is="itemComponent"
                @click.native="emitInternalValue"
                v-for="(item, index) in props.items"
                :key="index"
                :props="props"
                :item="item"
                :item-key="moreInfo"
                :class="{active: props.activeIndex === index}"
                >
            </component>
        </template>
    </typeahead>
</div>
</template>

<script>
import Typeahead from 'uiv/dist/Typeahead';
import TypeaheadItem from './typeaheadItem';
import {debounce} from './../utils';

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
        handleArrowKeyScroll(index) {
            if (this.scrollable && this.$refs.dropdown[index]) {
                this.$refs.dropdown[index].$el.scrollIntoView(true);
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
