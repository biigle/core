<div class="col-sm-6 col-lg-4">
	<div class="panel panel-default" data-ng-controller="ProjectLabelsController" data-ng-class="{'panel-warning': editing}">
		<div class="panel-heading">
			<h3 class="panel-title">
				Labels
                @if($isAdmin)
                    <button class="btn btn-default btn-xs pull-right" title="Edit project members" data-ng-click="edit()" data-ng-class="{active: editing}"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>
                @endif
			</h3>
		</div>
        <ul class="project-categories-list list-group">
            <li class="project-label-category-item list-group-item" data-ng-class="{open: isOpen, expandable: isExpandable, selected: isSelected, 'text-danger': removing}" data-ng-repeat="item in categoriesTree[null]"></li>
            <li data-ng-if="noItems" class="list-group-item text-muted">No labels.</li>
        </ul>
	</div>
</div>

<script type="text/ng-template" id="label-item.html">
<div class="item clearfix" data-ng-click="selectItem(item)">
    <span data-ng-if="!removing">
        <span class="item__name">@{{item.name}}</span>
        @if ($isAdmin)
            <button data-ng-if="editing" type="button" class="close ng-cloak" aria-label="Close" title="Remove this label" data-ng-click="startRemove()"><span aria-hidden="true">&times;</span></button>
        @endif
    </span>
    @if ($isAdmin)
        <span data-ng-if="removing" class="ng-cloak">
            Are you sure? <span class="pull-right"><button type="button" class="btn btn-danger btn-xs" data-ng-click="remove(item)">Remove</button> <button type="button" class="btn btn-default btn-xs" data-ng-click="cancelRemove()">Cancel</button></span>
        </span>
    @endif
</div>
</script>
