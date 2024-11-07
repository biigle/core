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

export default {
  data() {
    //TODO: add more filters here. See https://github.com/biigle/largo/issues/66
    let possibleShapes = biigle.$require('largo.availableShapes');

    //Load users with annotations
    let usersWithAnnotations = biigle.$require('largo.usersWithAnnotations')

    let possibleUsers = {};
    usersWithAnnotations.forEach(function (user) {
      possibleUsers[user.user_id] = user.lastname + ' ' + user.firstname
    });

    return {
      selectedAnnotationShape: null,
      selectedAnnotationUser: null,
      allowedFilters: ['Shape', 'User'],
      filterValues: {
        user_id: possibleUsers,
        shape_id: possibleShapes,
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
    addFilter() {
      if (!this.selectedFilterValue){
        Messages.danger("No filter selected!")
        return
      }
      let negationString

      if (this.negate) {
        negationString = 'is not'
        this.selectedFilterValue[1] = -this.selectedFilterValue[1]
      } else {
        negationString = 'is'
      }

      let filterToAdd = {
        name: this.selectedFilter + ' ' +  negationString + ' ' +  this.selectedFilterValue[0],
        filter: this.shapeToValue[this.selectedFilter],
        value: this.selectedFilterValue[1],
        union: this.union
      }
      this.$emit('add-filter', filterToAdd)
    },
  },
};
</script>
