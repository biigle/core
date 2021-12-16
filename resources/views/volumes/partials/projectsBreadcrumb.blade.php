@if ($projects->count() > 1)
    <dropdown tag="span" id="projects-breadcrumb">
        <a href="#" onclick="event.preventDefault()" class="dropdown-toggle navbar-link">Projects <span class="caret"></span></a>
        <template slot="dropdown">
            @foreach ($projects as $project)
                <li><a href="{{route('project', $project->id)}}">{{$project->name}}</a></li>
            @endforeach
        </template>
    </dropdown>
@else
    <a href="{{route('project', $projects->first()->id)}}" class="navbar-link" title="Show project {{$projects->first()->name}}">{{$projects->first()->name}}</a>
@endif
