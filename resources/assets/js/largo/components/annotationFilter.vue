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
                <input
                    v-if="selectedFilenameFilter"
                    type="text"
                    class="form-control"
                    v-model="filenamePattern"
                    placeholder="Filename pattern (use * for wildcards)"
                    title="Enter a filename pattern. Use * as wildcard to match any characters."
                    >
                <select
                    v-else
                    class="form-control"
                    v-model="selectedFilterValue"
                    >
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
                    :disabled="!canAddFilter"
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
import LargoProjectsApi from "../api/projects.js";
import ProjectsApi from "../../core/api/projects.js";
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

        let data = {
            filterValues: {
                Shape: availableShapes,
                User: {},
                Filename: {},
            },
            filterToKeyMapping: {
                Shape: "shape_id",
                User: "user_id",
                Filename: "filename",
            },
            selectedFilter: "Shape",
            selectedFilterValue: null,
            filenamePattern: '',
            negate: false,
        };

        //Project-specific filters
        let volumeId = biigle.$require("largo.volumeId");
        if (typeof volumeId !== "number") {
            data.filterValues["Volume"] = {};
            data.filterToKeyMapping["Volume"] = "volume_id";
        }
        return data
    },

    computed: {
        activeFilterValue() {
            return this.filterValues[this.selectedFilter];
        },
        canAddFilter() {
            if (this.selectedFilenameFilter) {
                return this.cleanFilenamePattern.length > 0;
            }

            return this.selectedFilterValue !== null;
        },
        cleanFilenamePattern() {
            return this.filenamePattern.trim();
        },
        selectedFilenameFilter() {
            return this.selectedFilter === 'Filename';
        },
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
            this.filenamePattern = '';
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
                    LargoProjectsApi.getUsersWithAnnotations({
                        id: projectId
                    });

                ProjectsApi.queryVolumes({
                        id: projectId
                    }).then(
                    (response) =>
                        response.data.forEach(
                            (volume) =>
                                (this.filterValues.Volume[volume.id] =
                                    volume.name)
                            ),
                    handleErrorResponse
                );
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
            let filterName;
            let filterValue;
            let logicalString;

            if (this.selectedFilenameFilter) {
                if (!this.cleanFilenamePattern) {
                    return;
                }

                filterName = this.cleanFilenamePattern;
                filterValue = this.cleanFilenamePattern;
                logicalString = this.negate ? 'does not match' : 'matches';
                this.filenamePattern = '';
            } else {
                if (!this.selectedFilterValue) {
                    return;
                }

                [filterName, filterValue] = this.selectedFilterValue;
                logicalString = this.negate ? 'is not' : 'is';
                this.selectedFilterValue = null;
            }

            if (this.negate) {
                filterValue = '-' + filterValue;
            }

            let filterToAdd = {
                name: this.selectedFilter + " " + logicalString + " " + filterName,
                filter: this.filterToKeyMapping[this.selectedFilter],
                value: filterValue,
            };
            this.$emit('add-filter', filterToAdd);
        }
    }
};
</script>
