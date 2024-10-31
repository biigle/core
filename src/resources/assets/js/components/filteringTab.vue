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
      shapes: {
        0: null
      },
      possibleUsers: {
        0: null
      },
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
        (k) => {
          if (selectedFilters[k] == null || selectedFilters[k] == 0) {
            delete selectedFilters[k]
          }
        }
      );
      this.$emit("handle-selected-filters", selectedFilters);
    },

    async loadShapes() {
      if (Object.keys(this.shapes).length == 1) {
        let loadedShapes = await this.annotationShapesLoader();
        this.shapes = { ...this.shapes, ...loadedShapes }
      }
    },

    async loadUsers() {
      if (Object.keys(this.possibleUsers).length == 1) {
        let loadedUsers = await this.possibleUsersLoader();
        let usersObject = {}
        loadedUsers.forEach(function (user) {
            usersObject[user.user_id] = user.lastname + ' ' + user.firstname
        });
        this.possibleUsers = {...this.possibleUsers, ...usersObject}
      }
    },
  },
};
</script>
