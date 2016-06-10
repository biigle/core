<div class="col-sm-6 col-lg-4">
    <div class="panel panel-default"@if($isAdmin) data-ng-controller="ProjectInformationController"@if($errors->has('name')||$errors->has('description')) data-ng-init="editing=true"@endif data-ng-class="{'panel-warning': editing}"@endif>
        <div class="panel-heading">
            Project Information
            @if($isAdmin)
                <button class="btn btn-default btn-xs pull-right" title="Edit project information" data-ng-click="edit()" data-ng-class="{active: editing}"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>
            @endif
        </div>
        <div class="panel-body">
            <form role="form" method="POST" action="{{ url('api/v1/projects/'.$project->id) }}">
                <div class="form-group{{ $errors->has('name') ? ' has-error' : '' }}">
                    <label for="projectName">Name:</label>
                    <div data-ng-if="!editing">{{ $project->name }}</div>
                    @if($isAdmin)
                        <input data-ng-if="editing" type="text" name="name" class="form-control ng-cloak" id="projectName" data-ng-model="project.name" />
                        @if($errors->has('name'))
                            <span data-ng-if="editing" class="help-block">{{ $errors->first('name') }}</span>
                        @endif
                    @endif
                </div>
                <div class="form-group{{ $errors->has('description') ? ' has-error' : '' }}">
                    <label for="projectDescription">Description:</label>
                    <div data-ng-if="!editing">{{ $project->description }}</div>
                    @if($isAdmin)
                        <textarea data-ng-if="editing" name="description" class="form-control ng-cloak" id="projectDescription" data-ng-model="project.description"></textarea>
                        @if($errors->has('description'))
                            <span data-ng-if="editing" class="help-block">{{ $errors->first('description') }}</span>
                        @endif
                    @endif
                </div>
                @if($isAdmin)
                    <input type="hidden" name="_method" value="put" />
                    <input type="hidden" name="_token" value="{{ csrf_token() }}" />
                    <button data-ng-if="editing" title="Save" type="submit" class="btn btn-success ng-cloak">Save</button>
                @endif
            </form>
        </div>
    </div>
</div>
