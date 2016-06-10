<div class="panel panel-default" data-ng-controller="ProjectLabelTreesController" data-ng-class="{'panel-warning': isEditing()}">
    <div class="panel-heading">
        Label Trees
        @can('update', $project)
            <span class="pull-right">
                <span class="ng-cloak" data-ng-if="isLoading()">loading...</span>
                <button class="btn btn-default btn-xs" title="Attach/detach label trees" data-ng-click="toggleEditing()" data-ng-class="{active: isEditing()}"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>
            </span>
        @endcan
    </div>
    @can('update', $project)
        <div data-ng-if="isEditing()" class="panel-body ng-cloak">
            <form class="form-inline">
                <div class="form-group">
                    <input type="text" class="form-control" id="new-label-tree" placeholder="Search label tree" data-ng-model="selected.tree" data-uib-typeahead="tree as tree.name for tree in getAvailableTrees() | filter:$viewValue | limitTo:10" data-typeahead-on-select="attachLabelTree($item)" title="Attach a new label tree" />
                </div>
            </form>
        </div>
    @endcan
    <ul class="list-group list-group-restricted">
        @can('update', $project)
            <li class="list-group-item ng-cloak" data-ng-repeat="tree in getTrees()">
                <button data-ng-if="isEditing()" type="button" class="ng-cloak close" aria-label="Close" title="Detach this tree" data-ng-click="detachLabelTree(tree)"><span aria-hidden="true">&times;</span></button>
                <span data-ng-bind="tree.name"></span>
                <span data-ng-if="tree.description">
                    <br><small data-ng-bind="tree.description"></small>
                </span>
            </li>
        @else
            @forelse ($labelTrees as $tree)
                <li class="list-group-item">
                    {{$tree->name}}
                    @if ($tree->description)
                        <br><small>{{$tree->description}}</small>
                    @endif
                </li>
            @empty
                <li class="list-group-item">This project uses no label trees</li>
            @endforelse
        @endcan
    </ul>
</div>
