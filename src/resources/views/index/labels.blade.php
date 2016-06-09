<div class="panel panel-default" data-ng-controller="LabelsController" data-ng-class="{'panel-warning':isEditing()}">
    <div class="panel-heading">
        Labels
        @can('create-label', $tree)
            <span class="pull-right">
                <span class="ng-cloak" data-ng-if="isLoading()">loading...</span>
                <button class="btn btn-default btn-xs" title="Edit labels" data-ng-click="toggleEditing()" data-ng-class="{active: isEditing()}"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>
            </span>
        @endcan
    </div>
    @can('create-label', $tree)
        <div class="panel-body ng-cloak" data-ng-if="isEditing()">
            <form class="form" data-ng-submit="addLabel()">
                <div class="row">
                    <div class="col-xs-12 help-block">
                        To add a new label, choose a color, an optional parent label and a name.
                    </div>
                    <div class="col-xs-4">
                        <div class="input-group">
                            <input type="color" class="form-control" id="new-label-color" title="Label color" data-ng-model="selected.color"/>
                            <span class="input-group-btn">
                                <button class="btn btn-default" type="button" title="Reset color" data-ng-click="resetColor()"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
                            </span>
                        </div>
                    </div>
                    <div class="col-xs-4">
                        <div class="input-group">
                            <input type="text" class="form-control" id="new-label-parent" placeholder="Label parent" data-ng-model="selected.label" data-uib-typeahead="label as label.name for label in getLabels() | filter:$viewValue | limitTo:10" data-typeahead-on-select="selectLabel($item)" data-ng-disabled="!hasLabels()" title="Parent label" />
                            <span class="input-group-btn">
                                <button class="btn btn-default" type="button" title="Reset parent" data-ng-click="resetParent()"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
                            </span>
                        </div>
                    </div>
                    <div class="col-xs-4">
                        <div class="input-group">
                            <input type="text" class="form-control" id="new-label-name" placeholder="Label name" title="New label name" data-ng-model="selected.name" />
                            <span class="input-group-btn">
                                <button class="btn btn-success" type="submit" title="Add the new label"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></button>
                            </span>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    @endcan
    <ul class="list-group list-group-restricted">
        <li data-ng-if="hasLabels()" class="ng-cloak label-tree-item list-group-item" data-ng-class="getClass()" data-ng-repeat="item in tree[null] | orderBy: 'name'"></li>
        <li class="ng-cloak list-group-item" data-ng-if="!hasLabels()">This tree has no labels</li>
    </ul>
</div>

<script type="text/ng-template" id="label-item.html">
    <div class="item clearfix" data-ng-click="selectLabel(item)">
        <button data-ng-if="isEditing()" type="button" class="close pull-right" aria-label="Close" title="Remove label @{{item.name}}" data-ng-click="removeLabel(item, $event)"><span aria-hidden="true">&times;</span></button>
        <span class="item__color" data-ng-style="{'background-color': '#' + item.color}"></span> <span class="item__name" data-ng-bind="item.name"></span>
    </div>
</script>

<script type="text/ng-template" id="label-subtree.html">
    <ul class="label-tree-subtree list-unstyled">
        <li class="label-tree-item" data-ng-class="getClass()" data-ng-repeat="item in tree[item.id] | orderBy: 'name'"></li>
    </ul>
</script>
