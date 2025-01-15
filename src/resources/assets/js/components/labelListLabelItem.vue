<template>
    <li v-if="showLabel" class="annotations-tab-item" :style="style" :title="title">
        <div class="annotations-tab-item__title" @click="emitSelectLabel">
            <span class="pull-right badge" v-text="count" :title="countTitle"></span>
            <span class="annotations-tab-item__color" :style="colorStyle"></span>
            <span v-text="label.name"></span>
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
    computed: {
        title() {
            return `Annotations with label ${this.label.name}`;
        },
        style() {
            return {
                'font-weight': this.label.selected ? 'bold' : '',
            };
        },
        countTitle() {
            return `There are ${this.count} annotations with label ${this.label.name}`;
        },
        colorStyle() {
            return 'background-color: #' + this.label.color;
        },
        count() {
            return this.label.count;
        },
        showLabel() {
            return this.count > 0;
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
