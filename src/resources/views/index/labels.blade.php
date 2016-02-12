<div class="col-sm-6 col-lg-4">
	<div class="panel panel-default" data-ng-controller="ProjectLabelsController" data-ng-class="{'panel-warning': editing}">
		<div class="panel-heading">
			<h3 class="panel-title">
				Labels
                @if($isAdmin)
                    <span class="pull-right">
                        <button class="btn btn-default btn-xs" title="Edit labels" data-ng-click="edit()" data-ng-class="{active: editing}"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>
                    </span>
                @endif
			</h3>
		</div>
        @if ($isAdmin)
            <div data-ng-if="editing" class="project-add-category panel-body ng-cloak">
                <form class="form" data-ng-submit="addLabel()">
                    <div class="row">
                        <div class="form-group col-xs-6">
                            <div class="input-group">
                                <input type="color" class="form-control" id="new-label-color" title="Label color" data-ng-model="newLabel.color"/>
                                <span class="input-group-btn">
                                    <button class="btn btn-default" type="button" title="Reset color" data-ng-click="resetColor()"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
                                </span>
                            </div>
                        </div>
                        <div class="form-group col-xs-6">
                            <div class="input-group">
                                <input type="text" class="form-control" id="new-label-parent" placeholder="Parent" data-ng-model="selected.label" data-uib-typeahead="label.name for label in labels | filter:$viewValue | limitTo:10" data-typeahead-on-select="selectItem($item)" data-ng-disabled="!labels.length" title="Parent label" />
                                <span class="input-group-btn">
                                    <button class="btn btn-default" type="button" title="Clear parent" data-ng-click="selectItem(null)"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
                                </span>
                            </div>
                        </div>
                        <div class="form-group col-xs-12">
                            <div class="input-group">
                                <input type="text" class="form-control" id="new-label-name" placeholder="Name" title="New label name" data-ng-model="newLabel.name" />
                                <span class="input-group-btn">
                                    <button class="btn btn-success" type="submit" title="Add the new label"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></button>
                                </span>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        @endif
        <ul class="project-categories-list list-unstyled">
            <li class="project-label-category-item" data-ng-class="{open: isOpen, expandable: isExpandable, selected: isSelected, 'text-danger': removing}" data-ng-repeat="item in categoriesTree[null] | orderBy: 'name'"></li>
            <li data-ng-if="!labels.length" class="text-muted ng-cloak">No labels.</li>
        </ul>
	</div>
</div>

<script type="text/ng-template" id="label-item.html">
    <div class="item clearfix" data-ng-click="selectItem(item)">
        <span data-ng-if="!removing">
            <span class="item__color" data-ng-style="{'background-color': '#' + item.color}"></span>
            <span class="item__name">@{{item.name}}</span>
            @if ($isAdmin)
                <button data-ng-if="editing" type="button" class="close ng-cloak" aria-label="Close" title="Remove this label" data-ng-click="startRemove()"><span aria-hidden="true">&times;</span></button>
            @endif
        </span>
        @if ($isAdmin)
            <span data-ng-if="removing" class="ng-cloak">
                Are you sure? <span class="pull-right"><button type="button" class="btn btn-danger btn-xs" data-ng-click="remove(item.id)">Remove</button> <button type="button" class="btn btn-default btn-xs" data-ng-click="cancelRemove()">Cancel</button></span>
            </span>
        @endif
    </div>
</script>

<script type="text/ng-template" id="label-subtree.html">
    <ul class="project-label-category-subtree list-unstyled">
        <li class="project-label-category-item" data-ng-class="{open: isOpen, expandable: isExpandable, selected: isSelected, 'text-danger': removing}" data-ng-repeat="item in categoriesTree[item.id] | orderBy: 'name'"></li>
    </ul>
</script>
