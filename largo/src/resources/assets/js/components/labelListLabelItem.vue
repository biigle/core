<template>
    <li class="annotations-tab-item--largo" :class="classObject" :title="title">
        <div class="annotations-tab-item__title--largo" @click="emitSelectLabel">
            <span class="pull-right badge" v-text="count" :title="countTitle"></span>
            <span class="annotations-tab-item__color--largo" :style="colorStyle"></span>
            <span v-text="label.name"></span>
        </div>
    </li>
</template>

<script>

export default {
    emits: [
        'select',
        'deselect',
    ],
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
        classObject() {
            return {
                selected: this.label.selected,
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
