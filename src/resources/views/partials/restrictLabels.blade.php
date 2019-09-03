<div class="form-group" :class="{'has-error': errors.only_labels}">
    <div class="checkbox">
        <label>
            <input type="checkbox" v-model="hasOnlyLabels"> Restrict to labels
        </label>
    </div>
    <div v-show="hasOnlyLabels" v-cloak class="form-control request-labels-list" readonly>
        <span v-for="label in selectedLabels" v-text="label.name"></span>
    </div>
    <div class="help-block" v-if="errors.only_labels" v-cloak v-text="getError('only_labels')"></div>
    <div v-else class="help-block">
        Restrict the report to specific labels. <span v-show="hasOnlyLabels" v-cloak>Select one or more labels below.</span>
    </div>
    <div v-show="hasOnlyLabels" v-cloak class="request-labels-well well well-sm">
        <label-trees :trees="labelTrees" :multiselect="true"></label-trees>
    </div>
</div>
