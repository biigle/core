@if ($projects->count() > 1)
    <span id="projects-breadcrumb">
        <dropdown tag="span">
            <a href="#" v-on:click.prevent class="dropdown-toggle navbar-link">Projects <span class="caret"></span></a>
            <template #dropdown>
                @foreach ($projects as $project)
                    <li><a href="{{route('project', $project->id)}}">{{$project->name}}</a></li>
                @endforeach
            </template>
        </dropdown>
    </span>
@else
    <a href="{{route('project', $projects->first()->id)}}" class="navbar-link" title="Show project {{$projects->first()->name}}">{{$projects->first()->name}}</a>
@endif
