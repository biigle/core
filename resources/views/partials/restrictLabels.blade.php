<div class="form-group" :class="{'has-error': errors.only_labels}">
    <div class="checkbox">
        <label :class="{'text-muted': options.all_labels}">
            <input type="checkbox" v-model="hasOnlyLabels" :disabled="options.all_labels"> Restrict to labels <span v-show="hasOnlyLabels" v-cloak>(<span v-text="selectedLabelsCount"></span> labels selected)</span>
        </label>
    </div>
    <div class="help-block" v-if="errors.only_labels" v-cloak v-text="getError('only_labels')"></div>
    <div v-else class="help-block">
        Restrict the report to specific labels. <span v-show="hasOnlyLabels" v-cloak>Select one or more labels below. Hold <kbd>Ctrl</kbd> to select all child labels and/or <kbd>Alt</kbd> to select all sibling labels.</span>
    </div>
    <div v-show="hasOnlyLabels" v-cloak class="request-labels-well well well-sm">
        <label-trees :trees="labelTrees" :multiselect="true" :allow-select-siblings="true" :allow-select-children="true"></label-trees>
    </div>
</div>
