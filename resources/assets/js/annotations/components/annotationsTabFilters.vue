<template>
    <form
        class="annotations-tab__filter form-inline"
        @submit.prevent
        >
            <select
                class="form-control"
                v-model="chosenFilterName"
                >
                    <option
                        v-for="(filter, name) in annotationFilters"
                        :value="name"
                        v-text="name"
                        ></option>
            </select>

            <component
                :is="chosenFilter"
                :annotations="annotations"
                @select="emitSelectFilter"
                @unselect="emitUnselectFilter"
                ></component>
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
                :disabled="!hasActiveFilter || null"
                @click.prevent="emitUnselectFilter"
                >
                    <i class="fa fa-times"></i>
            </button>
    </form>
</template>

<script>
import LabelFilter from './filters/labelAnnotationFilter.vue';
import SessionFilter from './filters/sessionAnnotationFilter.vue';
import ShapeFilter from './filters/shapeAnnotationFilter.vue';
import UserFilter from './filters/userAnnotationFilter.vue';

export default {
    emits: [
        'select',
        'unselect',
    ],
    props: {
        annotations: {
            type: Array,
            required: true,
        },
        hasActiveFilter: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            chosenFilterName: null,
        };
    },
    computed: {
        hasFilters() {
            return this.annotationFilters.length > 0;
        },
        chosenFilter() {
            return this.annotationFilters[this.chosenFilterName];
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
    created() {
        // Component objects should not be made reactive.
        this.annotationFilters = {
            label: LabelFilter,
            user: UserFilter,
            shape: ShapeFilter,
            session: SessionFilter,
        };
    }
};
</script>

