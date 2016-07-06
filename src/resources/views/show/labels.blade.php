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
            <div data-uib-tabset="" active="active">
                <div data-uib-tab="" index="0" heading="Manual" title="Manually add new labels">
                    @include('label-trees::show.labels.manual')
                </div>
                <div data-uib-tab="" index="0" heading="WoRMS" title="Import labels from the World Register of Marine Species">
                    @include('label-trees::show.labels.worms')
                </div>
            </div>

        </div>
    @endcan
    <ul class="list-group">
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
        <li class="label-tree-item" data-ng-class="getClass()" data-ng-repeat="item in getSubtree() | orderBy: 'name'"></li>
    </ul>
</script>
