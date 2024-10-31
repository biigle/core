<template>
  <div
    class="filtering-tab"
  >
    <div class="list-group filter-list-group">
      <label>Annotation Shape</label>
      <select
        class="form-control"
        @change="filterAnnotation"
        @click.once="loadShapes"
        v-model="selectedAnnotationShape"
      >
        <option
          v-for="(annotation_type_name, annotation_type_id) in this.shapes"
          :value="annotation_type_id"
          v-text="annotation_type_name"
        ></option>
      </select>
    </div>
    <div class="list-group filter-list-group">
      <label>Users with Annotations</label>
      <select
        class="form-control"
        @change="filterAnnotation"
        @click.once="loadUsers"
        v-model="selectedAnnotationUser"
      >
        <option
          v-for="(annotation_type_name, annotation_type_id) in this.possibleUsers"
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
    annotationShapesLoader: {
      type: Function,
      required: true,
    },
    possibleUsersLoader: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      selectedAnnotationShape: null,
      selectedAnnotationUser: null,
      shapes: {},
      possibleUsers: {},
    };
  },
  methods: {
    filterAnnotation() {
      //TODO: add more filters here. See https://github.com/biigle/largo/issues/66
      let selectedFilters = {
        shape_id: this.selectedAnnotationShape,
        user_id: this.selectedAnnotationUser,
      };
      //Filter out null filters, this can cause bad requests to be sent
      Object.keys(selectedFilters).forEach(
        (k) => selectedFilters[k] == null && delete selectedFilters[k]
      );
      this.$emit("handle-selected-filters", selectedFilters);
    },

    async loadShapes() {
      if (Object.keys(this.shapes).length < 1) {
        this.shapes = await this.annotationShapesLoader();
      }
    },

    async loadUsers() {
      if (Object.keys(this.possibleUsers).length < 1) {
        this.possibleUsers = await this.possibleUsersLoader();
      }
    },
  },
};
</script>
