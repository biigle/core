<template>
  <div class="filtering-tab"
>
  <label>Annotations where: </label>
  <ul class="list-group">
      <li class="list-group-item" v-for="filter, k in activeFilters">
          <span>{{ filter.name }}</span>
          <button @click.once="removeFilter(k)" type="button"
          class="btn btn-default  fa fa-window-close" ></button>
      </li>
  </ul>
  <form class="form clearfix" v-on:submit.prevent>
    <div class="filter-form__selects">
        <annotation-filter @add-filter="addNewFilter">
        </annotation-filter>
    </div>
    </form>

  </div>
</template>
<script>
import AnnotationFilter from '../components/annotationFilter.vue'

export default {
  components: {
    AnnotationFilter
  },
  data() {
    return {
      activeFilters: []
    };
  },
  methods: {
    removeFilter(key){
      this.activeFilters.splice(key, 1)
      this.filterAnnotations()
    },
    addNewFilter(filter) {
      if (this.activeFilters.length > 0) {
        let union_string
        if (!filter.union) {
          union_string = 'And '
        } else {
          union_string = 'Or '
        }
        filter.name = union_string + filter.name
      }
      this.activeFilters.push(filter)
      this.filterAnnotations()
      },

    filterAnnotations() {
      this.$emit("handle-selected-filters", this.activeFilters);
    },
  },
};
</script>
