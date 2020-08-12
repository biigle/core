<div class="clearfix" id="projects-title">
    <span class="pull-right project-buttons">
        <span v-if="!editing">
            @if (config('biigle.project_overview_v2_feedback'))
                <a href="mailto:{{config('biigle.admin_email')}}?subject=Feedback%20for%20the%20new%20project%20overview&body=[please%20tell%20us%20what%20you%20think%20about%20the%20new%20project%20overview]" class="btn btn-info" title="Give feedback on the new project overview"><i class="fa fa-heart"></i> Give Feedback</a>
            @endif
            <form class="inline-block-form" method="POST" action="{{ url('api/v1/users/my/settings') }}">
                <input type="hidden" name="project_overview_v1" value="1">
                <input type="hidden" name="_redirect" value="{{route('project', $project->id)}}">
                <input type="hidden" name="_method" value="PUT">
                <input type="hidden" name="_token" value="{{ csrf_token() }}">
                <div class="form-group">
                    <button type="submit" class="btn btn-default" title="Switch to the old layout of the project overview">Old layout</button>
                </div>
            </form>
        </span>
        @can('update', $project)
            <span v-if="editing" v-cloak>
                <button class="btn btn-success" title="Save changes" v-on:click="saveChanges" :disabled="loading || !isChanged"><span v-if="loading">Saving...</span><span v-else>Save</span></button>
                <button class="btn btn-default" title="Discard changes" v-on:click="discardChanges" :disabled="loading">Cancel</button>
            </span>
        @endcan
        <span class="dropdown">
            <button class="btn btn-default dropdown-toggle"><i class="fa fa-cog"></i> <span class="caret"></span></button>
            <ul class="dropdown-menu">
                @if ($isMember)
                    <li @unless($isPinned || $canPin) class="disabled" @endunless>
                        @if ($isPinned)
                            <a onclick="event.preventDefault();document.getElementById('pin-form').submit();" title="Unpin this project from the dashboard">Unpin</a>
                            <form id="pin-form" action="{{url("api/v1/projects/{$project->id}/pin")}}" method="POST" style="display: none;">
                                <input type="hidden" name="_token" value="{{ csrf_token() }}">
                                <input type="hidden" name="_redirect" value="{{ route('project', $project->id) }}">
                                <input type="hidden" name="_method" value="DELETE">
                            </form>
                        @elseif ($canPin)
                            <a onclick="event.preventDefault();document.getElementById('pin-form').submit();" title="Pin this project to the dashboard">Pin</a>
                            <form id="pin-form" action="{{url("api/v1/projects/{$project->id}/pin")}}" method="POST" style="display: none;">
                                <input type="hidden" name="_token" value="{{ csrf_token() }}">
                                <input type="hidden" name="_redirect" value="{{ route('project', $project->id) }}">
                            </form>
                        @else
                            <a title="You cannot pin more than three projects to the dashboard">Pin</a>
                        @endif
                    </li>
                @endif
                @can('update', $project)
                    <li :class="disabledClass">
                        <a title="Edit project title and description" v-on:click="startEditing">Edit</a>
                    </li>
                @endcan
                @if ($isMember)
                    <li :class="disabledClass">
                        <a title="Revoke membership of this project" v-on:click="leaveProject">Leave</a>
                    </li>
                @endif
                @can('update', $project)
                    <li role="separator" class="divider"></li>
                    <li :class="disabledClass">
                        <a title="Delete this project" v-on:click="deleteProject">Delete</a>
                    </li>
                @endcan
            </ul>
        </span>
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
            <span v-text="name">{{$project->name}}</span>
            <span v-if="hasDescription" @if (!$project->description) v-cloak @endif>
                <br><small v-text="description">{{$project->description}}</small>
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
