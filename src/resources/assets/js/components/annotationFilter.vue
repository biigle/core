<template>
  <div class="annotation-filter">
    <div class="form-group">
      <div class="btn-group" role="group">
        <button
          type="button"
          class="btn btn-default"
          title="Use the 'and' operator for filter rules"
          :class="{ active: !union }"
          @click="activateAndOperator"
        >
          and
        </button>
        <button
          type="button"
          class="btn btn-default"
          title="Use the 'or' operator for filter rules"
          :class="{ active: union }"
          @click="activateOrOperator"
        >
          or
        </button>
      </div>
      <div class="btn-group pull-right" role="group">
        <button
          type="button"
          class="btn btn-default"
          title="Clear all filter rules"
          @click="reset"
        >
          <span class="fa fa-times" aria-hidden="true"></span>
        </button>
      </div>
    </div>
    <div class="filter-form__selects">
      <div class="form-group largo-filter-select">
        <select
          class="form-control"
          selected="Shapes"
          v-model="selectedFilter"
          @change="changeSelectedFilter"
          title="Select attribute for filtering"
          @click.once="loadApiFilters"
        >
          <option
            v-for="value in this.allowedFilters"
            :value="value"
            v-text="value"
          ></option>
        </select>
      </div>
      <div class="form-group largo-filter-select filter-select">
        <select class="form-control" v-model="negate" selected="true" required>
          <option :value="false">is</option>
          <option :value="true">is not</option>
        </select>
      </div>
    </div>
    <div class="filter-form__selects">
      <div class="form-group largo-filter-select">
        <select class="form-control" v-model="selectedFilterValue">
          <option
            v-for="(filter_name, filter_id) in this.activeFilter"
            :value="[filter_name, filter_id]"
            v-text="filter_name"
          ></option>
        </select>
      </div>
      <div class="form-group filter-select largo-filter-select">
        <button type="button" class="btn btn-default btn-block" title="Add the selected filter rule" @click="addFilter">
        Add rule
      </button>

      </div>
    </div>
  </div>
</template>
<script>
import { Messages } from "../import";
import ProjectsApi from "../api/projects";
import VolumesApi from "../api/volumes";

export default {
  data() {
    //TODO: add more filters here. See https://github.com/biigle/largo/issues/66
    let possibleShapes = biigle.$require("largo.availableShapes");

    return {
      selectedAnnotationShape: null,
      selectedAnnotationUser: null,
      allowedFilters: ["Shape", "User"],
      filterValues: {
        shape_id: possibleShapes,
        user_id: {},
      },
      shapeToValue: {
        Shape: "shape_id",
        User: "user_id",
      },
      activeFilter: possibleShapes,
      selectedFilter: "Shape",
      selectedFilterValue: null,
      negate: false,
      union: false,
    };
  },
  methods: {
    activateAndOperator() {
      this.union = false;
      this.$emit('set-union-logic', 0);
    },
    activateOrOperator() {
      this.union = true;
      this.$emit('set-union-logic', 1);
    },
    reset() {
      this.$emit("reset-filters");
    },
    changeSelectedFilter() {
      this.activeFilter =
        this.filterValues[this.shapeToValue[this.selectedFilter]];
      this.selectedFilterValue = null;
    },
    loadApiFilters() {
      //Load here filters that should be loaded AFTER the page is rendered
      let volumeId = biigle.$require("largo.volumeId");
      let usersWithAnnotationsPromise;
      if (typeof volumeId === "number") {
        usersWithAnnotationsPromise = VolumesApi.getUsersWithAnnotations({
          id: volumeId,
        });
      } else {
        let projectId = biigle.$require("largo.projectId");
        usersWithAnnotationsPromise = ProjectsApi.getUsersWithAnnotations({
          id: projectId,
        });
      }
      usersWithAnnotationsPromise.then((response) =>
        response.data.forEach(
          (user) =>
            (this.filterValues["user_id"][user.user_id] =
              user.lastname + " " + user.firstname),
        ),
      );
    },
    addFilter() {
      if (!this.selectedFilterValue) {
        Messages.danger("No filter selected!");
        return;
      }
      let logicalString;

      //convert to integer
      this.selectedFilterValue[1] = +this.selectedFilterValue[1];
      if (this.negate) {
        logicalString = "is not";
        if (this.selectedFilterValue[1] > 0){
          this.selectedFilterValue[1] = -this.selectedFilterValue[1];
        }
      } else {
        logicalString = "is";
      }

      let filterToAdd = {
        name:
          this.selectedFilter +
          " " +
          logicalString +
          " " +
          this.selectedFilterValue[0],
        filter: this.shapeToValue[this.selectedFilter],
        value: this.selectedFilterValue[1],
      };
      this.$emit("add-filter", filterToAdd);
    },
  },
};
</script>
