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
                    title="Select attribute for filtering"
                    @click.once="loadApiFilters"
                    @change="resetSelectedFilter"
                >
                    <option
                        v-for="value in Object.keys(filterValues)"
                        :value="value"
                        v-text="value"
                    ></option>
                </select>
            </div>
            <div class="form-group largo-filter-select filter-select">
                <select
                    class="form-control"
                    v-model="negate"
                    selected="true"
                    required
                >
                    <option :value="false">is</option>
                    <option :value="true">is not</option>
                </select>
            </div>
        </div>
        <div class="filter-form__selects">
            <div class="form-group largo-filter-select">
                <select class="form-control" v-model="selectedFilterValue">
                    <option
                        v-for="(filter_name, filter_id) in activeFilterValue"
                        :value="[filter_name, filter_id]"
                        v-text="filter_name"
                    ></option>
                </select>
            </div>
            <div class="form-group filter-select largo-filter-select">
                <button
                    type="button"
                    :disabled="!selectedFilterValue || null"
                    class="btn btn-default btn-block"
                    title="Add the selected filter rule"
                    @click="addFilter"
                >
                    Add rule
                </button>
            </div>
        </div>
    </div>
</template>
<script>
import ProjectsApi from "../api/projects.js";
import VolumesApi from "../api/volumes.js";
import { handleErrorResponse } from "@/core/messages/store.js";

export default {
    emits: [
        'set-union-logic',
        'reset-filters',
        'add-filter',
    ],
    props: {
        union: {
            type: Boolean,
            required: true,
        }
    },
    data() {
        //TODO: add more filters here. See https://github.com/biigle/largo/issues/66
        let availableShapes = biigle.$require("largo.availableShapes");

        return {
            filterValues: {
                Shape: availableShapes,
                User: {},
                "Size": {
                    0: "No area",
                    1: "Very small (< 100 px²)",
                    2: "Small (100-1000 px²)",
                    3: "Medium (1k-10k px²)",
                    4: "Large (10k-100k px²)",
                    5: "Very large (> 100k px²)"
                }
            },
            filterToKeyMapping: {
                Shape: "shape_id",
                User: "user_id",
                "Size": "annotation_size"
            },
            selectedFilter: "Shape",
            selectedFilterValue: null,
            negate: false,
        };
    },

    computed: {
        activeFilterValue() {
            return this.filterValues[this.selectedFilter];
        }
    },

    methods: {
        activateAndOperator() {
            this.$emit("set-union-logic", false);
        },
        activateOrOperator() {
            this.$emit("set-union-logic", true);
        },
        reset() {
            this.$emit("reset-filters");
        },
        resetSelectedFilter() {
            this.selectedFilterValue = null;
        },
        loadApiFilters() {
            //Load here filters that should be loaded AFTER the page is rendered
            let volumeId = biigle.$require("largo.volumeId");
            let usersWithAnnotationsPromise;

            if (typeof volumeId === "number") {
                usersWithAnnotationsPromise =
                    VolumesApi.getUsersWithAnnotations({
                        id: volumeId
                    });
            } else {
                let projectId = biigle.$require("largo.projectId");
                usersWithAnnotationsPromise =
                    ProjectsApi.getUsersWithAnnotations({
                        id: projectId
                    });
            }

            usersWithAnnotationsPromise.then(
                (response) =>
                    response.data.forEach(
                        (user) =>
                            (this.filterValues.User[user.user_id] =
                                user.name)
                    ),
                handleErrorResponse
            );
        },
        addFilter() {
            if (!this.selectedFilterValue) {
                return;
            }

            let logicalString;

            //Avoid changing directly the value of selectedFilterValue
            //This can cause weird bugs on the frontend otherwise
            let selectedFilterValue = [...this.selectedFilterValue];

            //convert to integer
            selectedFilterValue[1] = +selectedFilterValue[1];

            if (this.negate) {
                logicalString = "is not";
                if (selectedFilterValue[1] > 0) {
                    selectedFilterValue[1] = -selectedFilterValue[1];
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
                    selectedFilterValue[0],
                filter: this.filterToKeyMapping[this.selectedFilter],
                value: selectedFilterValue[1]
            };
            this.$emit('add-filter', filterToAdd);
        }
    }
};
</script>
