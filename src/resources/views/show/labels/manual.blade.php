<form class="form" data-ng-submit="addLabel()" data-ng-controller="ManualLabelsController">
    <div class="row">
        <div class="col-xs-12 help-block">
            To add a new label, choose a color, an optional parent label and a name.
        </div>
        <div class="col-xs-4 form-group form-group">
            <div class="input-group">
                <input type="color" class="form-control" id="new-label-color" title="Label color" data-ng-model="selected.color"/>
                <span class="input-group-btn">
                    <button class="btn btn-default" type="button" title="Reset color" data-ng-click="resetColor()" data-ng-disabled="!isColorDirty()" disabled=""><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
                </span>
            </div>
        </div>
        <div class="col-xs-4 form-group">
            <div class="input-group">
                <input type="text" class="form-control" id="new-label-parent" placeholder="Label parent" data-ng-model="selected.label" data-uib-typeahead="label as label.name for label in getLabels() | filter:$viewValue | limitTo:10" data-typeahead-on-select="selectLabel($item)" data-ng-disabled="!hasLabels()" title="Parent label" />
                <span class="input-group-btn">
                    <button class="btn btn-default" type="button" title="Reset parent" data-ng-click="resetParent()" data-ng-disabled="!isParentDirty()" disabled=""><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
                </span>
            </div>
        </div>
        <div class="col-xs-4 form-group">
            <div class="input-group">
                <input type="text" class="form-control" id="new-label-name" placeholder="Label name" title="New label name" data-ng-model="selected.name" />
                <span class="input-group-btn">
                    <button class="btn btn-success" type="submit" title="Add the new label" data-ng-disabled="!isNameDirty()" disabled=""><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></button>
                </span>
            </div>
        </div>
    </div>
</form>
