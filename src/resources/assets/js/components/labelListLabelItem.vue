<template>
    <li class="annotations-tab-item" :style="style" :title="title">
        <div class="annotations-tab-item__title" @click="emitSelectLabel">
            <span class="pull-right badge" v-text="count" :title="countTitle"></span>
            <span class="annotations-tab-item__color" :style="colorStyle"></span>
            <span v-text="labelItem.name"></span>
        </div>
    </li>
</template>

<script>

export default {
    props: {
        label: {
            type: Object,
            default() {
                return {};
            },
        },
    },
    data() {
        return {
            labelItem: {}
        }
    },
    computed: {
        title() {
            return `Annotations with label ${this.labelItem.name}`;
        },
        style() {
            return {
                'font-weight': this.labelItem.selected ? 'bold' : '',
            };
        },
        countTitle() {
            return `There are ${this.labelItem.count} annotations with label ${this.labelItem.name}`;
        },
        colorStyle() {
            return 'background-color: #' + this.labelItem.color;
        },
        count() {
            return this.labelItem.count;
        }
    },
    methods: {
        emitSelectLabel() {
            this.labelItem.selected = !this.labelItem.selected
            if (this.labelItem.selected) {
                this.$emit('select', this.labelItem)
            } else {
                this.$emit('deselect');
            }
        }
    },
    created() {
        this.labelItem = this.label;
    }
};
</script>
