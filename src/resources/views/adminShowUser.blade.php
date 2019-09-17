<div class="col-xs-12">
    <div class="row">
        <div class="col-xs-6">
            <div class="panel panel-default">
                <div class="panel-body">
                    @if ($creatorCount > 0)
                        Created <strong>{{$creatorCount}}</strong> {{$creatorCount === 1 ? 'project' : 'projects'}} ({{$creatorPercent}} %).
                    @else
                        Created no projects yet.
                    @endif
                </div>
                <ul class="list-group user-stats-list-group">
                    @foreach ($creatorProjects as $project)
                        <li class="list-group-item"><a href="{{route('project', $project->id)}}">{{$project->name}}</a></li>
                    @endforeach
                </ul>
            </div>
        </div>
        <div class="col-xs-6">
            <div class="panel panel-default">
                <div class="panel-body">
                    @if ($memberCount > 0)
                        Is member in <strong>{{$memberCount}}</strong> {{$memberCount === 1 ? 'project' : 'projects'}} ({{$memberPercent}} %).
                    @else
                        Is member on no projects.
                    @endif
                </div>
                <ul class="list-group user-stats-list-group">
                    @foreach ($memberProjects as $project)
                        <li class="list-group-item"><a href="{{route('project', $project->id)}}">{{$project->name}}</a></li>
                    @endforeach
                </ul>
            </div>
        </div>
    </div>
</div>
