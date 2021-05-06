<template>
<div class="typeahead clearfix">
    <input
        ref="input"
        class="form-control"
        type="text"
        :disabled="disabled"
        :placeholder="placeholder"
        @focus="emitFocus"
        @blue="emitBlur"
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
            <li
                v-for="(item, index) in props.items"
                :class="{active:props.activeIndex === index}"
                >
                <component
                    :is="templateComponent"
                    :props="props"
                    :item="item"
                    ></component>
            </li>
        </template>
    </typeahead>
</div>
</template>

<script>
import Typeahead from 'uiv/dist/Typeahead';

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
        template: {
            default: null,
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
    computed: {
        templateComponent() {
            let template = `
                <a href="#" @click.prevent="props.select(item)">
            `;

            if (this.template) {
                template += this.template;
            } else {
                template += '<span v-html="props.highlight(item)"></span>';
            }

            template += '</a>';

            return {
                props: ['props', 'item'],
                template: template,
            };
        },
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
