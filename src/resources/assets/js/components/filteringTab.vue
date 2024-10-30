<template>
  <div
    class="filtering-tab"
    @click.once="loadShapes"
  >
    <div class="list-group filter-list-group">
      <label>Annotation Shape</label>
      <select
        class="form-control"
        @change="filterAnnotation"
        v-model="annotationShape"
      >
        <option
          v-for="(annotation_type_name, annotation_type_id) in this.shapes"
          :value="annotation_type_id"
          v-text="annotation_type_name"
        ></option>
      </select>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    annotationShapes: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      annotationShape: null,
      shapes: {},
    };
  },
  computed: {
    getAnnotationShapes() {
      return this.getShapes();
    },
  },
  methods: {
    filterAnnotation() {
      let selectedFilters = {
        shape_id: this.annotationShape,
      };
      this.$emit("handle-selected-filters", selectedFilters);
    },

    async loadShapes() {
      if (Object.keys(this.shapes).length < 1) {
        this.shapes = await this.annotationShapes();
      }
    },
  },
  created() {},
};
</script>
