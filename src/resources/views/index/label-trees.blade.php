<div class="col-sm-6 col-lg-4">
    <div class="panel panel-default" data-ng-controller="ProjectLabelTreesController" data-ng-class="{'panel-warning': isEditing()}">
        <div class="panel-heading">
            <h3 class="panel-title">
                Label Trees
                @if($isAdmin)
                    <span class="pull-right">
                        <button class="btn btn-default btn-xs" title="Attach/detach label trees" data-ng-click="toggleEditing()" data-ng-class="{active: isEditing()}"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>
                    </span>
                @endif
            </h3>
        </div>
        @if($isAdmin)
            <div data-ng-if="isEditing()" class="panel-body ng-cloak">
                <form class="form-inline">
                <span data-ng-if="isLoading()" class="pull-right">loading...</span>
                    <div class="form-group">
                        <input type="text" class="form-control" id="new-label-tree" placeholder="Search label tree" data-ng-model="selected.tree" data-uib-typeahead="tree as tree.name for tree in getAvailableTrees() | filter:$viewValue | limitTo:10" data-typeahead-on-select="attachLabelTree($item)" title="Attach a new label tree" />
                    </div>
                </form>
            </div>
        @endif
        <ul class="list-group">
            @forelse ($project->labelTrees as $tree)
                <li class="list-group-item" data-ng-init="addUsedTree({{$tree->id}})" id="label-tree-item-{{$tree->id}}">
                    @if ($isAdmin)
                        <button data-ng-if="isEditing()" type="button" class="ng-cloak close ng-cloak" aria-label="Close" title="Detach this tree" data-ng-click="detachLabelTree({{$tree->id}})"><span aria-hidden="true">&times;</span></button>
                    @endif
                    {{$tree->name}}
                    @if ($tree->description)
                        <br><small>{{$tree->description}}</small>
                    @endif
                </li>
            @empty
                <li class="list-group-item">This project uses no label trees</li>
            @endforelse
            @if($isAdmin)
                <li data-ng-if="hasNewTrees()" class="ng-cloak list-group-item list-group-item-success" data-ng-repeat="tree in getNewTrees()">
                    <button data-ng-if="isEditing()" type="button" class="close pull-right" aria-label="Close" title="Detach this tree" data-ng-click="detachLabelTree(tree.id)"><span aria-hidden="true">&times;</span></button>
                    <span data-ng-bind="tree.name"></span>
                    <span data-ng-if="tree.description"><br><small data-ng-bind="tree.description"></small></span>
                </li>
            @endif
        </ul>
    </div>
</div>
