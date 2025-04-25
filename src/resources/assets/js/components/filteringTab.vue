<template>
    <div class="filtering-tab">
        <form class="form clearfix" v-on:submit.prevent>
            <annotation-filter
                :union="union"
                @add-filter="$emit('add-filter', $event)"
                @set-union-logic="$emit('set-union-logic', $event)"
                @reset-filters="$emit('reset-filters')"
            >
            </annotation-filter>
        </form>
        <ul class="list-group">
            <li
                class="list-group-item text-muted"
                v-if="activeFilters.length == 0"
            >
                No filter rules
            </li>
            <li class="list-group-item" v-for="(filter, k) in activeFilters">
                <span v-if="k > 0"> {{ logicString }} </span>
                <span>{{ filter.name }}</span>
                <button
                    @click="removeFilter(k)"
                    type="button"
                    class="close"
                    title="Remove this filter rule"
                >
                    <span aria-hidden="true">&times;</span>
                </button>
            </li>
        </ul>
    </div>
</template>
<script>
import AnnotationFilter from "../components/annotationFilter.vue";

export default {
    components: {
        AnnotationFilter
    },
    props: {
        activeFilters: {
            type: Array,
            required: true,
        },
        union: {
            type: Boolean,
            required: true,
        }
    },
    computed: {
        logicString() {
            return this.union ? "or" : "and";
        }
    },
    methods: {
        removeFilter(key) {
            this.$emit('remove-filter', key);
        },
    },
};
</script>
