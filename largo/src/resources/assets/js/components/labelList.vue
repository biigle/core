<template>
    <div class="annotations-tab--largo">
        <div class="annotations-tab__header--largo">
            <div class="text-muted">Total
                <span
                    class="pull-right badge"
                    v-text="annotationBadgeCount"
                ></span>
            </div>
        </div>
        <ul class="annotations-tab__list--largo list-unstyled" ref="scrollList">
            <label-item
                 v-for="item in labels"
                 :key="item.id"
                 :label="item"
                 @select="handleSelectedLabel"
                 @deselect="handleDeselectedLabel"
                 ></label-item>
        </ul>
    </div>
</template>

<script>
import LabelItem from './labelListLabelItem.vue';


export default {
    emits: [
        'select',
        'deselect',
    ],
    components: {
        labelItem: LabelItem,
    },
    props: {
        labels: {
            type: Array,
            default() {
                return [];
            },
        },
    },
    computed: {
        annotationBadgeCount() {
            return this.labels.reduce((acc, l) => {
                return acc + l.count;
            }, 0);
        },
    },
    methods: {
        handleSelectedLabel(label) {
            this.$emit('select', label);
        },
        handleDeselectedLabel() {
            this.$emit('deselect');
        },
    },
};
</script>
