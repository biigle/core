<div class="col-md-12 clearfix" data-ng-controller="ProjectController">
    @can('update', $project)
        <div data-ng-switch="isEditing()">
            <span class="pull-right ng-cloak" data-ng-switch-when="true">
                <span data-ng-switch="isSaving()">
                    <button class="btn btn-success ng-cloak" title="Save changes" data-ng-switch-when="true" disabled="">Saving...</button>
                    <button class="btn btn-success" title="Save changes" data-ng-click="saveChanges()" data-ng-switch-default="">Save</button>
                </span>
                <button class="btn btn-default" title="Discard changes" data-ng-click="discardChanges()" data-ng-disabled="isSaving()">Cancel</button>
            </span>
            <span class="pull-right" data-ng-switch-default="">
                <button class="btn btn-default" data-ng-click="toggleEditing()">Edit</button>
                <button class="btn btn-default" data-ng-click="deleteProject()">Delete</button>
                <button class="btn btn-default" data-ng-click="leaveProject()">Leave</button>
            </span>
            <form class="ng-cloak form-inline project-info-form" data-ng-switch-when="true" data-ng-submit="saveChanges()">
                <div class="form-group">
                    <input class="form-control project-name" type="text" title="Project name" placeholder"Name" data-ng-model="projectInfo.name"/>
                    <br>
                    <input class="form-control input-sm project-description" type="text" title="Project description" placeholder="Description" data-ng-model="projectInfo.description"/>
                    <input class="hidden" type="submit" name="submit">
                </div>
            </form>
            <h2 data-ng-switch-default="">
                <span data-ng-bind="getName()">{{$project->name}}</span>
                <span class="@if(!$project->description) hidden @endif" data-ng-if="getDescription()">
                    <br><small data-ng-bind="getDescription()">{{$project->description}}</small>
                </span>
            </h2>
        </div>
    @else
        <h2>
            <span class="pull-right">
                <button class="btn btn-default" data-ng-click="leaveProject()">Leave</button>
            </span>
            {{$project->name}}
            @if($project->description)
                <br><small>{{$project->description}}</small>
            @endif
        </h2>
    @endcan
</div>
