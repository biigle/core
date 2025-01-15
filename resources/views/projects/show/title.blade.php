<div class="clearfix" id="projects-title">
    <span class="pull-right project-buttons">
        @can('update', $project)
            <span v-if="editing" v-cloak>
                <button class="btn btn-success" title="Save changes" v-on:click="saveChanges" :disabled="loading || !isChanged"><span v-if="loading">Saving...</span><span v-else>Save</span></button>
                <button class="btn btn-default" title="Discard changes" v-on:click="discardChanges" :disabled="loading">Cancel</button>
            </span>
        @endcan
        <dropdown menu-right>
            <button class="btn btn-default dropdown-toggle"><i class="fa fa-cog"></i> <span class="caret"></span></button>
            <template #dropdown>
                @if ($isMember)
                    <li @unless($isPinned || $canPin) class="disabled" @endunless>
                        @if ($isPinned)
                            <a onclick="event.preventDefault();document.getElementById('pin-form').submit();" title="Unpin this project from the dashboard" href="#">Unpin</a>
                            <form id="pin-form" action="{{url("api/v1/projects/{$project->id}/pin")}}" method="POST" style="display: none;">
                                <input type="hidden" name="_token" value="{{ csrf_token() }}">
                                <input type="hidden" name="_redirect" value="{{ route('project', $project->id) }}">
                                <input type="hidden" name="_method" value="DELETE">
                            </form>
                        @elseif ($canPin)
                            <a onclick="event.preventDefault();document.getElementById('pin-form').submit();" title="Pin this project to the dashboard" href="#">Pin</a>
                            <form id="pin-form" action="{{url("api/v1/projects/{$project->id}/pin")}}" method="POST" style="display: none;">
                                <input type="hidden" name="_token" value="{{ csrf_token() }}">
                                <input type="hidden" name="_redirect" value="{{ route('project', $project->id) }}">
                            </form>
                        @endif
                    </li>
                @endif
                @if ($isMember)
                    <li :class="disabledClass">
                        <a title="Revoke membership of this project" v-on:click.prevent="leaveProject" href="#">Leave</a>
                    </li>
                @endif
                @can('update', $project)
                    <li role="separator" class="divider"></li>
                    <li :class="disabledClass">
                        <a title="Edit project title and description" v-on:click.prevent="startEditing" href="#">Edit</a>
                    </li>
                    <li :class="disabledClass">
                        <a title="Delete this project" v-on:click.prevent="deleteProject" href="#">Delete</a>
                    </li>
                @endcan
            </template>
        </dropdown>
    </span>
    @can('update', $project)
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
            <span v-if="false">{{$project->name}}</span>
            <span v-text="name" v-cloak></span>

            @if ($project->description)
                <span v-if="false">
                    <br><small>{{$project->description}}</small>
                </span>
            @endif
            <span v-if="hasDescription" v-cloak>
                <br><small v-text="description"></small>
            </span>
        </h2>
    @else
        <h2>
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
