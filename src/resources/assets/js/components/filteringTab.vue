<template>
  <div class="filtering-tab">
    <form class="form clearfix" v-on:submit.prevent>
      <annotation-filter
        @reset-filters="resetFilters"
        @add-filter="addNewFilter"
      >
      </annotation-filter>
    </form>
    <ul class="list-group">
      <li class="list-group-item" v-if="activeFilters.length == 0">
        <span>No filter rules</span>
      </li>
      <li class="list-group-item" v-for="(filter, k) in activeFilters">
          <span v-if="k > 0"> {{ logicString }} </span> <span>{{ filter.name }}</span>
        <button @click="removeFilter(k)" type="button" class="close">
          <span aria-hidden="true">x</span>
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
      logicString: 'And ',
    };
  },
  methods: {
    resetFilters() {
      this.activeFilters = [];
      this.logicStrings = [];
      this.filterAnnotations();
    },
    removeFilter(key) {
      this.activeFilters.splice(key, 1);
      this.filterAnnotations();
    },
    addNewFilter(filter) {
      let logic_string = '';
      if (this.activeFilters.length > 0) {
        if (_.some(this.activeFilters, filter)){
          Messages.danger('Filter already present!')
          return
        }
        if (filter.union !== this.activeFilters[0].union){
            Messages.danger('Combination of "and" and "or" filtering is not yet supported')
            return
        }
        if (filter.union) {
            this.logicString = 'Or ';
        } else {
            this.logicString = 'And ';
        }
      }
      this.activeFilters.push(filter);
      this.filterAnnotations();
    },

    filterAnnotations() {
      this.$emit("handle-selected-filters", this.activeFilters);
    },
  },
};
</script>
