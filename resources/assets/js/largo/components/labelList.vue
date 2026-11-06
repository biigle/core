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
                 :filtered-count="filteredCount(item)"
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
        filteredCounts: {
            type: Object,
            default: null,
        },
    },
    computed: {
        annotationBadgeCount() {
            let count = this.labels.reduce((acc, l) => {
                return acc + l.count;
            }, 0);

            if (this.filteredCounts) {
                let filteredCount = this.labels.reduce((acc, l) => {
                    return acc + this.filteredCount(l);
                }, 0);

                return `${filteredCount}/${count}`;
            }

            return count;
        },
    },
    methods: {
        filteredCount(label) {
            if (this.filteredCounts) {
                return this.filteredCounts[label.id] || 0;
            }

            return null;
        },
        handleSelectedLabel(label) {
            this.$emit('select', label);
        },
        handleDeselectedLabel() {
            this.$emit('deselect');
        },
    },
};
</script>
