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
        >
    <typeahead
        v-model="internalValue"
        :target="inputElement"
        :data="items"
        :force-select="true"
        :limit="limit"
        item-key="name"
        >
        <template slot="item" slot-scope="props">
            <typeahead-item
                v-for="(item, index) in props.items"
                :key="index"
                :props="props"
                :item="item"
                :item-key="moreInfo"
                :class="{active: props.activeIndex === index}"
                >
            </typeahead-item>
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
        typeaheadItem: TypeaheadItem,
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
    },
    data() {
        return {
            inputElement: null,
            internalValue: undefined,
        };
    },
    methods: {
        clear() {
            this.internalValue = undefined;
            this.$refs.input.value = '';
        },
        emitFocus(e) {
            this.$emit('focus', e);
        },
        emitBlur(e) {
            this.$emit('blur', e);
        },
    },
    watch: {
        internalValue(value) {
            if (typeof value === 'object') {
                this.$emit('input', value);
                this.$emit('select', value);
                if (this.clearOnSelect) {
                    this.clear();
                }
            }
        },
        value(value) {
            this.internalValue = value;
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
