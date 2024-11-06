<template>
  <div
    class="filtering-tab"
  >
    <div class="list-group filter-list-group">
      <label>Annotation Shape</label>
      <select
        class="form-control"
        @change="filterAnnotation"

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
  data() {
    let possibleShapes = biigle.$require('largo.availableShapes');
    possibleShapes = { ['0']: null, ...possibleShapes };

    //Load users with annotations
    let usersWithAnnotations = biigle.$require('largo.usersWithAnnotations')

    let possibleUsers = {};
    usersWithAnnotations.forEach(function (user) {
      possibleUsers[user.user_id] = user.lastname + ' ' + user.firstname
    });
    possibleUsers = { ['0']: null, ...possibleUsers }
    return {
      selectedAnnotationShape: null,
      selectedAnnotationUser: null,
      shapes: possibleShapes,
      possibleUsers: possibleUsers,
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
  },
};
</script>
