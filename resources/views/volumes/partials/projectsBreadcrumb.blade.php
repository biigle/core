@if ($projects->count() > 1)
    <span class="dropdown">
        <a href="#" class="dropdown-toggle navbar-link">Projects <span class="caret"></span></a>
        <ul class="dropdown-menu">
            @foreach ($projects as $project)
                <li><a href="{{route('project', $project->id)}}">{{$project->name}}</a></li>
            @endforeach
        </ul>
    </span>
@else
    <a href="{{route('project', $projects->first()->id)}}" class="navbar-link" title="Show project {{$projects->first()->name}}">{{$projects->first()->name}}</a>
@endif
