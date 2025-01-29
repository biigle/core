<template>
  <div class="filtering-tab">
    <form class="form clearfix" v-on:submit.prevent>
      <annotation-filter
        @reset-filters="resetFilters"
        @add-filter="addNewFilter"
        @set-union-logic="setUnionLogic"
      >
      </annotation-filter>
    </form>
    <ul class="list-group">
      <li class="list-group-item text-muted" v-if="activeFilters.length == 0">
        No filter rules
      </li>
      <li class="list-group-item" v-for="(filter, k) in activeFilters">
        <span v-if="k > 0"> {{ logicString }} </span> <span>{{ filter.name }}</span>
        <button @click="removeFilter(k)" type="button" class="close" title="Remove this rule">
          <span aria-hidden="true">&times;</span>
        </button>
      </li>
    </ul>
  </div>
</template>
<script>
import AnnotationFilter from "../components/annotationFilter.vue";
import {Messages} from '../import'
import _ from 'lodash';

export default {
  components: {
    AnnotationFilter,
  },
  data() {
    return {
      activeFilters: [],
      logicString: 'and ',
    };
  },
  methods: {
    resetFilters() {
      this.activeFilters = [];
      this.filterAnnotations();
    },
    removeFilter(key) {
      this.activeFilters.splice(key, 1);
      this.filterAnnotations();
    },
    setUnionLogic(union){
      this.union  = union
      this.logicString = union ? 'or ' : 'and '
      this.filterAnnotations()
    },
    addNewFilter(filter) {
      if (this.activeFilters.length > 0) {
        if (this.activeFilters.some(f => f.filter === filter.filter && f.value === filter.value)) {
          Messages.danger('Filter already present!')
          return
        }
      }
      this.activeFilters.push(filter);
      this.filterAnnotations();
    },

    filterAnnotations() {
      this.$emit("handle-selected-filters", this.activeFilters, this.union);
    },
  },
};
</script>
