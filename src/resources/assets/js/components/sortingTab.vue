<template>
    <div class="sorting-tab">
        <div class="sorting-tab__buttons">
            <div class="btn-group" role="group">
                <button
                    type="button"
                    class="btn btn-default"
                    title="Sort ascending"
                    :class="{active: sortedAscending}"
                    @click="sortAscending"
                        >
                        <span class="fa fa-sort-amount-up"></span>
                    </button>
                <button
                    type="button"
                    class="btn btn-default"
                    title="Sort descending"
                    :class="{active: sortedDescending}"
                    @click="sortDescending"
                        >
                        <span class="fa fa-sort-amount-down"></span>
                    </button>
            </div>
            <div class="btn-group pull-right" role="group">
                <button
                    type="button"
                    class="btn btn-default"
                    title="Reset sorting"
                    @click="reset"
                    >
                        <span class="fa fa-times"></span>
                    </button>
            </div>
        </div>

        <div class="list-group sorter-list-group">
            <button
                class="list-group-item"
                title="Sort by annotation ID (lower is older)"
                :class="{active: sortingByAnnotationId}"
                @click="sortByAnnotationId"
                >
                ID
            </button>
            <button
                class="list-group-item"
                title="Sort by outliers (lower is more dissimilar)"
                :class="{active: sortingByOutlier}"
                @click="sortByOutlier"
                >
                Outliers
            </button>
        </div>
    </div>
</template>

<script>

export const SORT_DIRECTION = {
    ASCENDING: 0,
    DESCENDING: 1,
};

export const SORT_KEY = {
    ANNOTATION_ID: 0,
    OUTLIER: 1,
};

export default {
    data() {
        return {
            sortDirection: SORT_DIRECTION.ASCENDING,
            sortKey: SORT_KEY.ANNOTATION_ID,
        };
    },
    computed: {
        sortedAscending() {
            return this.sortDirection === SORT_DIRECTION.ASCENDING;
        },
        sortedDescending() {
            return this.sortDirection === SORT_DIRECTION.DESCENDING;
        },
        sortingByAnnotationId() {
            return this.sortKey === SORT_KEY.ANNOTATION_ID;
        },
        sortingByOutlier() {
            return this.sortKey === SORT_KEY.OUTLIER;
        },
    },
    methods: {
        sortAscending() {
            this.sortDirection = SORT_DIRECTION.ASCENDING;
        },
        sortDescending() {
            this.sortDirection = SORT_DIRECTION.DESCENDING;
        },
        reset() {
            this.sortAscending();
            this.sortByAnnotationId();
        },
        sortByAnnotationId() {
            this.sortKey = SORT_KEY.ANNOTATION_ID;
        },
        sortByOutlier() {
            this.sortKey = SORT_KEY.OUTLIER;
        },
    },
    watch: {
        sortDirection(direction) {
            this.$emit('change-direction', direction);
        },
        sortKey(key) {
            this.$emit('change-key', key);
        },
    },
};
</script>

