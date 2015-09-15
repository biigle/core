@extends('admin.base')

@section('title')Labels admin area @stop

@section('admin-content')
<div class="col-xs-12">
    <div class="panel panel-default" data-ng-controller="AdminLabelsController">
        <div class="admin-add-category panel-body">
            <form class="form" data-ng-submit="addLabel()">
                <div class="row">
                    <div class="col-xs-6">
                        <div class="input-group">
                            <input type="text" class="form-control" id="new-label-parent" placeholder="Parent" data-ng-model="selected.label" data-typeahead="label.name for label in labels | filter:$viewValue | limitTo:10" data-typeahead-on-select="selectItem($item)" data-ng-disabled="!labels.length" title="Parent label" />
                            <span class="input-group-btn">
                                <button class="btn btn-default" type="button" title="Clear parent" data-ng-click="selectItem(null)"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
                            </span>
                        </div>
                    </div>
                    <div class="col-xs-6">
                        <div class="input-group">
                            <input type="text" class="form-control" id="new-label-name" placeholder="Name" title="New label name" data-ng-model="newLabel.name" />
                            <span class="input-group-btn">
                                <button class="btn btn-success" type="submit" title="Add the new label"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></button>
                            </span>
                        </div>
                    </div>
                    <div class="col-xs-12 help-block">
                        Add new global labels by choosing a parent label and entering the label name.
                    </div>
                </div>
            </form>
        </div>
        <ul class="admin-categories-list list-unstyled">
            <li class="admin-label-category-item" data-ng-class="{open: isOpen, expandable: isExpandable, selected: isSelected, 'text-danger': removing}" data-ng-repeat="item in categoriesTree[null] | orderBy: 'name'"></li>
            <li data-ng-if="!labels.length" class="text-muted ng-cloak">No labels.</li>
        </ul>
    </div>
</div>

<script type="text/ng-template" id="label-item.html">
    <div class="item clearfix" data-ng-click="selectItem(item)">
        <span data-ng-if="!removing">
            <span class="item__name">@{{item.name}}</span>
            <button type="button" class="close" aria-label="Close" title="Remove this label" data-ng-click="startRemove()"><span aria-hidden="true">&times;</span></button>
        </span>
        <span data-ng-if="removing" class="ng-cloak">
            Are you sure? <span class="pull-right"><button type="button" class="btn btn-danger btn-xs" data-ng-click="remove(item.id)">Remove</button> <button type="button" class="btn btn-default btn-xs" data-ng-click="cancelRemove()">Cancel</button></span>
        </span>
    </div>
</script>

<script type="text/ng-template" id="label-subtree.html">
    <ul class="admin-label-category-subtree list-unstyled">
        <li class="admin-label-category-item" data-ng-class="{open: isOpen, expandable: isExpandable, selected: isSelected, 'text-danger': removing}" data-ng-repeat="item in categoriesTree[item.id] | orderBy: 'name'"></li>
    </ul>
</script>
@endsection
