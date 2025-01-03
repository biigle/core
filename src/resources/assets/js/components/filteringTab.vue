<template>
  <div class="filtering-tab">
    <label>Annotations where: </label>
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
        <span>{{ filter.name }}</span>
        <button @click="removeFilter(k)" type="button" class="close">
          <span aria-hidden="true">x</span>
        </button>
      </li>
    </ul>
  </div>
</template>
<script>
import AnnotationFilter from "../components/annotationFilter.vue";

export default {
  components: {
    AnnotationFilter,
  },
  data() {
    return {
      activeFilters: [],
    };
  },
  methods: {
    resetFilters() {
      this.activeFilters = [];
      this.filterAnnotations();
    },
    removeFilter(key) {
      this.activeFilters.splice(key, 1);
      //If its the first filter to be removed, remove the 'And' or 'Or'
      if ((this.activeFilters.length > 0) & (key == 0)) {
        this.activeFilters[0].name = this.activeFilters[0].name.substring(
          this.activeFilters[0].name.indexOf(" ", 0),
        );
      }
      this.filterAnnotations();
    },
    addNewFilter(filter) {
      if (this.activeFilters.length > 0) {
        let union_string;
        if (!filter.union) {
          union_string = "And ";
        } else {
          union_string = "Or ";
        }
        filter.name = union_string + filter.name;
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
