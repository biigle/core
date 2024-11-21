<template>
    <li class="annotations-tab-item" :class="classObject" :title="title">
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
        count: {
            type: Number,
            default() {
                return 0;
            },
        },
        isSelected: {
            type: Boolean,
            default: false,
        }
    },
    computed: {
        title() {
            return `Annotations with label ${this.label.name}`;
        },
        classObject() {
            return {
                selected: this.isSelected,
            };
        },
        countTitle() {
            return `There are ${this.count} annotations with label ${this.label.name}`;
        },
        colorStyle() {
            return 'background-color: #' + this.label.color;
        },
    },
    methods: {
        emitSelectLabel() {
            if(!this.isSelected){
                this.$emit('select', this.label)
            } else {
                this.$emit('deselect');
            }
        }
    },
};
</script>
