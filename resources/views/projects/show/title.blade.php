<div class="col-md-12 clearfix" id="projects-title">
    @can('update', $project)
        <span class="pull-right project-buttons" v-if="editing" v-cloak>
            <button class="btn btn-success" title="Save changes" v-on:click="saveChanges" :disabled="loading || !isChanged"><span v-if="loading">Saving...</span><span v-else>Save</span></button>
            <button class="btn btn-default" title="Discard changes" v-on:click="discardChanges" :disabled="loading">Cancel</button>
        </span>
        <span class="pull-right project-buttons" v-else>
            @if ($isMember)
                @include('projects.partials.pinButton')
            @endif
            <button class="btn btn-default" v-on:click="startEditing" :disabled="loading">Edit</button>
            <button class="btn btn-default" v-on:click="deleteProject" :disabled="loading">Delete</button>
            @if ($isMember)
                <button class="btn btn-default" v-on:click="leaveProject" :disabled="loading">Leave</button>
            @endif
        </span>
        <form v-if="editing" v-cloak class="form-inline project-info-form" v-on:submit.prevent="saveChanges">
            <div class="form-group">
                <input class="form-control project-name" type="text" title="Project name" placeholder="Name" v-model="name"/>
                <br>
                <input class="form-control input-sm project-description" type="text" title="Project description" placeholder="Description" v-model="description"/>
                <input class="hidden" type="submit" name="submit">
            </div>
        </form>
        <h2 v-else>
            @if ($isPinned)
                <i class="fa fa-thumbtack text-muted" title="This project is pinned to the dashboard"></i>
            @endif
            <span v-text="name">{{$project->name}}</span>
            <span v-if="hasDescription" @if (!$project->description) v-cloak @endif>
                <br><small v-text="description">{{$project->description}}</small>
            </span>
        </h2>
    @else
        <h2>
            @if ($isMember)
                <span class="pull-right">
                    @include('projects.partials.pinButton')
                    <button class="btn btn-default" v-on:click="leaveProject" :disabled="loading">Leave</button>
                </span>
            @endif
            @if ($isPinned)
                <i class="fa fa-thumbtack text-muted" title="This project is pinned to the dashboard"></i>
            @endif
            {{$project->name}}
            @if($project->description)
                <br><small>{{$project->description}}</small>
            @endif
        </h2>
    @endcan
</div>
