<template>
    <div class="annotation-filter">
        <div class="form-group">
            <select class="form-control" v-model="union" selected="true" required>
                <option :value='false'>and</option>
                <option :value='true'>or</option>
            </select>
        </div>
        <div class="list-group filter-list-group" >
            <select
            class="form-control"
            selected="Shapes"
            v-model="selectedFilter"
            @change="changeSelectedFilter"
            @click="loadApiFilters"
            >
            <option
                v-for="value in this.allowedFilters"
                :value="value"
                v-text="value"
            ></option>
            </select>
        </div>
        <div class="form-group">
            <select class="form-control" v-model="negate" selected="true" required>
                <option :value="false">is</option>
                <option :value="true">is not</option>
            </select>
        </div>
        <div class="list-group filter-list-group">
           <select
           class="form-control"
           v-model="selectedFilterValue"
           >

           <option
               v-for="(filter_name, filter_id) in this.activeFilter"
               :value="[filter_name, filter_id]"
               v-text="filter_name"
           ></option>
           </select>
       </div>

       <button type="button"
       class="btn btn-default" @click="addFilter">Add filter</button>
        <button class="fa-dismiss" hidden="filterSelected"></button>
    </div>
</template>
<script>
import {Messages} from '../import';
import ProjectsApi from '../api/projects';
import VolumesApi from '../api/volumes';

export default {
  data() {
    //TODO: add more filters here. See https://github.com/biigle/largo/issues/66
    let possibleShapes = biigle.$require('largo.availableShapes');

    return {
      selectedAnnotationShape: null,
      selectedAnnotationUser: null,
      allowedFilters: ['Shape', 'User'],
      filterValues: {
        shape_id: possibleShapes,
        user_id: {},
      },
      shapeToValue : {
        Shape: 'shape_id',
        User: 'user_id',
      },
      activeFilter: possibleShapes,
      selectedFilter: 'Shape',
      selectedFilterValue: null,
      filterSelected: null,
      negate: false,
      union: false,
    };
  },
  methods: {
    changeSelectedFilter() {
      this.activeFilter = this.filterValues[this.shapeToValue[this.selectedFilter]]
      },
    loadApiFilters() {
        //Load here filters that should be loaded AFTER the page is rendered
        let volumeId = biigle.$require('largo.volumeId');
        let usersWithAnnotationsPromise;
        if (typeof volumeId === 'number'){
            usersWithAnnotationsPromise = VolumesApi.getUsersWithAnnotations({id: volumeId});
        } else {
            let projectId = biigle.$require('largo.projectId');
            usersWithAnnotationsPromise = ProjectsApi.getUsersWithAnnotations({id: projectId});
        }
        let usersWithAnnotations = usersWithAnnotationsPromise.then((response) =>
            response.data.forEach((user) => this.filterValues['user_id'][user.user_id] =  user.lastname + ' ' + user.firstname)
            );
    },
    addFilter() {
      if (!this.selectedFilterValue){
        Messages.danger("No filter selected!")
        return
      }
      let logicalString

      if (this.negate) {
        logicalString = 'is not'
        this.selectedFilterValue[1] = -this.selectedFilterValue[1]
      } else {
        logicalString = 'is'
      }

      let filterToAdd = {
        name: this.selectedFilter + ' ' +  logicalString + ' ' +  this.selectedFilterValue[0],
        filter: this.shapeToValue[this.selectedFilter],
        value: this.selectedFilterValue[1],
        union: this.union
      }
      this.$emit('add-filter', filterToAdd)
    },
  },
};
</script>
