<div class="panel panel-default">
    <div class="panel-heading">Projects using this label tree</div>
    <ul class="list-group list-group-restricted">
        @if (Route::has('project'))
            @foreach($projects as $project)
                <li class="list-group-item"><a href="{{route('project', $project->id)}}">{{$project->name}}</a></li>
            @endforeach
        @else
            @foreach($projects as $project)
                <li class="list-group-item">{{$project->name}}</li>
            @endforeach
        @endif
        @if ($projects->count() === 0)
            <li class="list-group-item">This label tree is not used by any of your projects.</li>
        @endif
    </ul>
</div>
