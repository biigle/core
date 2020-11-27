<p class="text-muted">
    @if (isset($version))
        Projects using this label tree version:
    @else
        Projects using this label tree:
    @endif
</p>
<div class="panel panel-default">
    <ul class="list-group list-group-restricted">
        @foreach ($projects as $project)
            <li class="list-group-item">
                <h4 class="list-group-item-heading">
                    <a href="{{route('project', $project->id)}}">{{$project->name}}</a>
                </h4>
                @if ($project->description)
                    <p class="list-group-item-text">{{$project->description}}</p>
                @endif
            </li>
        @endforeach
        @if ($projects->count() === 0)
            <li class="list-group-item text-muted">
                @if (isset($version))
                    This label tree version is not used by any of your projects.
                @else
                    This label tree is not used by any of your projects.
                @endif
            </li>
        @endif
    </ul>
</div>
