<template>
    <form
        class="annotations-tab__filter form-inline"
        @submit.prevent
        >
            <select
                class="form-control"
                v-model="chosenFilterIndex"
                >
                    <option
                        v-for="(filter, index) in annotationFilters"
                        :value="index"
                        v-text="filter.name"
                        ></option>
            </select>

            <span
                v-show="chosenFilter"
                ref="filterElement"
                ></span>
            <input
                v-show="!chosenFilter"
                class="form-control"
                placeholder="Filter annotations"
                type="text"
                disabled="true"
                >

            <button
                class="btn btn-default"
                title="Clear annotation filter"
                :class="clearButtonClass"
                :disabled="!hasActiveFilter"
                @click.prevent="emitUnselectFilter"
                >
                    <i class="fa fa-times"></i>
            </button>
    </form>
</template>

<script>
export default {
    emits: [
        'select',
        'unselect',
    ],
    props: {
        annotationFilters: {
            type: Array,
            default() {
                return [];
            },
        },
        hasActiveFilter: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            chosenFilterIndex: null,
        };
    },
    computed: {
        hasFilters() {
            return this.annotationFilters.length > 0;
        },
        chosenFilter() {
            return this.annotationFilters[this.chosenFilterIndex];
        },
        clearButtonClass() {
            return {
                'btn-info': this.hasActiveFilter,
            };
        },
    },
    methods: {
        emitSelectFilter(filter) {
            this.$emit('select', filter);
        },
        emitUnselectFilter() {
            this.$emit('unselect');
        },
    },
    watch: {
        chosenFilter(filter, oldFilter) {
            if (oldFilter) {
                this.$refs.filterElement.removeChild(oldFilter.$el);
                oldFilter.$off('select', this.emitSelectFilter);
                oldFilter.$off('unselect', this.emitUnselectFilter);
            }

            this.$refs.filterElement.appendChild(filter.$el);
            filter.$on('select', this.emitSelectFilter);
            filter.$on('unselect', this.emitUnselectFilter);
        },
    },
};
</script>

