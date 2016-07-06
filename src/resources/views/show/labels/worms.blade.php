<form class="form" data-ng-controller="WormsLabelsController">
    <div class="row">
        <div class="col-xs-12 help-block">
            Import labels from <a href="http://marinespecies.org" target="_blank">WoRMS</a>. First, choose a color for the new label. Then search the WoRMS item based on the scientific name. Last, select the item you want to import from the search results.
        </div>
        <div class="col-xs-6 form-group form-group">
            <div class="input-group">
                <input type="color" class="form-control" id="new-label-color" title="Label color" data-ng-model="selected.color"/>
                <span class="input-group-btn">
                    <button class="btn btn-default" type="button" title="Reset color" data-ng-click="resetColor()" data-ng-disabled="!isColorDirty()" disabled=""><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
                </span>
            </div>
        </div>
        <div class="col-xs-6 form-group">
            <div class="input-group">
                <input type="text" class="form-control" id="new-label-name" placeholder="Label name" title="WoRMS label name" data-ng-model="selected.name" />
                <span class="input-group-btn">
                    <button class="btn btn-success" title="Find a label from WoRMS" data-ng-disabled="!isNameDirty()" disabled="" data-ng-click="find()"><span class="glyphicon glyphicon-search" aria-hidden="true"></span></button>
                </span>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col-xs-6 form-group">
            <button class="btn btn-default btn-block" data-ng-click="toggleRecursive()" data-ng-class="{active:isRecursive(), 'btn-primary':isRecursive()}" title="Recursively import all parent labels from WoRMS (if they don't alerady exist)">
                Recursive
            </button>
        </div>
        <div class="col-xs-6 form-group">
            <div class="input-group">
                <input type="text" class="form-control" id="new-label-parent" placeholder="Label parent" data-ng-model="selected.label" data-uib-typeahead="label as label.name for label in getLabels() | filter:$viewValue | limitTo:10" data-typeahead-on-select="selectLabel($item)" data-ng-disabled="!hasLabels() || isRecursive()" title="Parent label" />
                <span class="input-group-btn">
                    <button class="btn btn-default" type="button" title="Reset parent" data-ng-click="resetParent()" data-ng-disabled="!isParentDirty() || isRecursive()" disabled=""><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
                </span>
            </div>
        </div>
    </div>
    <div class="row" data-ng-hide="isFinding()">
        <div class="col-xs-12">
            <ul class="list-group list-group-restricted">
                <li class="list-group-item ng-cloak" data-ng-repeat="result in getFindResults()" data-ng-class="{'list-group-item-success':hasBeenImported(result)}">
                    <small class="text-muted" data-ng-bind="getClassification(result)"></small>
                    <div class="clearfix">
                        <span class="pull-right">
                            <button class="btn btn-default btn-xs" data-ng-click="addLabel(result)" title="@{{getAddButtonTitle(result)}}"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></button>
                        </span>
                        <span data-ng-bind="result.rank"></span>: <a href="@{{result.url}}" target="_blank" title="Show WoRMS page" data-ng-bind="result.name"></a>
                    </div>
                </li>
                <li class="list-group-item text-muted" data-ng-if="!isFinding() && !hasFindResults()">
                    No results from WoRMS search
                </li>
            </ul>
        </div>
    </div>
</form>
