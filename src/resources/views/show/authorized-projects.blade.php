<div class="panel panel-default @if(!$private) ng-hide @endif" data-ng-controller="AuthorizedProjectsController" data-ng-class="{'panel-warning':isEditing()}" data-ng-hide="getVisibilityId() !== {{Biigle\Visibility::$private->id}}">
    <div class="panel-heading">
        Authorized Projects
        <span class="pull-right">
            <span class="loader" data-ng-class="{'loader--active':isLoading()}"></span>
            <button class="btn btn-default btn-xs" title="Edit authorized projects" data-ng-click="toggleEditing()" data-ng-class="{active: isEditing()}"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>
        </span>
    </div>
    <div data-ng-if="isEditing()" class="panel-body ng-cloak">
        <form class="form-inline">
            <div class="form-group">
                <input type="text" class="form-control" id="new-authorized-project" placeholder="Project name" data-ng-model="selected.project" data-uib-typeahead="project as project.name for project in getProjectsForAuthorization() | filter:$viewValue | limitTo:10" data-typeahead-on-select="addAuthorizedProject($item)" title="Authorize one of your projects to use this tree" />
            </div>
        </form>
    </div>
    <ul class="list-group list-group-restricted">
        @if (Route::has('project'))
            <li class="ng-cloak list-group-item" data-ng-repeat="project in getProjects()" data-ng-switch="isOwnProject(project)">
                <button data-ng-if="isEditing()" type="button" class="close pull-right" aria-label="Close" title="Remove authorization of this tree" data-ng-click="removeAuthorizedProject(project)"><span aria-hidden="true">&times;</span></button>
                <a href="{{route('project', '')}}/@{{project.id}}" data-ng-switch-when="true" data-ng-bind="project.name"></a>
                <span data-ng-switch-default="" data-ng-bind="project.name"></span>
            </li>
        @else
            <li class="ng-cloak list-group-item" data-ng-repeat="project in getProjects()">
                <button data-ng-if="isEditing()" type="button" class="close pull-right" aria-label="Close" title="Remove authorization of this tree" data-ng-click="removeAuthorizedProject(project)"><span aria-hidden="true">&times;</span></button>
                <span data-ng-bind="project.name"></span>
            </li>
        @endif
        <li class="ng-cloak list-group-item" data-ng-if="!hasProjects()">
            There are no projects authorized to use this label tree.
        </li>
    </ul>
</div>
