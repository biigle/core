<template>
    <div class="sorting-tab">
        <div class="sorting-tab__buttons">
            <div class="btn-group" role="group">
                <button
                    type="button"
                    class="btn btn-default"
                    title="Sort descending"
                    :class="{active: sortedDescending}"
                    @click="sortDescending"
                        >
                        <span class="fa fa-sort-amount-down"></span>
                    </button>
                <button
                    type="button"
                    class="btn btn-default"
                    title="Sort ascending"
                    :class="{active: sortedAscending}"
                    @click="sortAscending"
                        >
                        <span class="fa fa-sort-amount-up"></span>
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
                title="Sort by annotation timestamp (higher is newer)"
                :class="{active: sortingByAnnotationId}"
                @click="sortByAnnotationId"
                >
                Created
            </button>
            <button
                class="list-group-item"
                title="Sort by outliers (higher is more dissimilar)"
                :class="{active: sortingByOutlier}"
                @click="sortByOutlier"
                >
                Outliers
            </button>
            <a
                class="list-group-item"
                title="Sort by similarity (higher is more similar)"
                href="#"
                :class="{
                    active: sortingBySimilarity,
                    'list-group-item-warning': needsSimilarityReference
                }"
                @click.prevent="initializeSortBySimilarity"
                >
                <button
                    v-if="needsSimilarityReference"
                    class="btn btn-default btn-xs pull-right"
                    title="Cancel selecting a reference annotation"
                    @click.stop="cancelSortBySimilarity"
                    >
                    <i class="fa fa-undo"></i>
                </button>
                Similarity
                <p v-if="needsSimilarityReference">
                    Select a reference annotation with a click on the <i class="fa fa-thumbtack fa-fw"></i> button.
                </p>
            </a>
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
    SIMILARITY: 2,
};

export default {
    props: {
        sortKey: {
            type: Number,
            required: true,
        },
        sortDirection: {
            type: Number,
            required: true,
        },
        needsSimilarityReference: {
            type: Boolean,
            default: false,
        },
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
        sortingBySimilarity() {
            return this.sortKey === SORT_KEY.SIMILARITY;
        },
    },
    methods: {
        sortAscending() {
            this.$emit('change-direction', SORT_DIRECTION.ASCENDING);
        },
        sortDescending() {
            this.$emit('change-direction', SORT_DIRECTION.DESCENDING);
        },
        reset() {
            this.sortDescending();
            this.sortByAnnotationId();
        },
        sortByAnnotationId() {
            this.$emit('change-key', SORT_KEY.ANNOTATION_ID);

            if (this.needsSimilarityReference) {
                this.cancelSortBySimilarity();
            }
        },
        sortByOutlier() {
            this.$emit('change-key', SORT_KEY.OUTLIER);

            if (this.needsSimilarityReference) {
                this.cancelSortBySimilarity();
            }
        },
        initializeSortBySimilarity() {
            this.$emit('init-similarity');
        },
        cancelSortBySimilarity() {
            this.$emit('cancel-similarity');
        },
    },
};
</script>

