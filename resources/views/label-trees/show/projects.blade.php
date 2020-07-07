<div class="panel panel-default">
    @if (isset($version))
        <div class="panel-heading">Projects using this label tree version</div>
    @else
        <div class="panel-heading">Projects using this label tree</div>
    @endif
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
            @if (isset($version))
                <li class="list-group-item">This label tree version is not used by any of your projects.</li>
            @else
                <li class="list-group-item">This label tree is not used by any of your projects.</li>
            @endif
        @endif
    </ul>
</div>
