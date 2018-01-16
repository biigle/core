<div class="col-xs-12">
    <div class="row">
        <div class="col-xs-6">
            <p>
                @if ($creatorCount > 0)
                    Created <strong>{{$creatorCount}}</strong> {{$creatorCount === 1 ? 'project' : 'projects'}} ({{$creatorPercent}} %).
                @else
                    Created no projects yet.
                @endif
            </p>
            <ul>
                @foreach ($creatorProjects as $project)
                    <li><a href="{{route('project', $project->id)}}">{{$project->name}}</a></li>
                @endforeach
            </ul>
        </div>
        <div class="col-xs-6">
            <p>
                @if ($memberCount > 0)
                    Is member in <strong>{{$memberCount}}</strong> {{$memberCount === 1 ? 'project' : 'projects'}} ({{$memberPercent}} %).
                @else
                    Is member on no projects.
                @endif
            </p>
            <ul>
                @foreach ($memberProjects as $project)
                    <li><a href="{{route('project', $project->id)}}">{{$project->name}}</a></li>
                @endforeach
            </ul>
        </div>
    </div>
</div>
