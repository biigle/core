<div id="projects-dashboard-main">
    @forelse($projects as $project)
        <div class="row">
            <h3 class="col-sm-12">
                <a href="{{route('project', $project->id)}}" title="Show project {{$project->name}}">
                    {{$project->name}}
                </a>
            </h3>
            @foreach ($mixins as $module => $nestedMixins)
                @include($module.'::dashboardMain.projects')
            @endforeach
        </div>
    @empty
        <div class="row">
            <div class="panel panel-info col-md-6 col-md-offset-3">
                <div class="panel-body text-info">
                    You do not belong to any projects yet. You can @can ('create', Biigle\Project::class) <a href="{{route('projects-create')}}">create your own project</a> or @endcan request a project admin to add you to a project.
                </div>
            </div>
        </div>
    @endforelse
    @if ($projects->isNotEmpty())
        <div class="row">
            <div class="col-xs-12 dashboard__all-projects">
                <a href="{{route('search', ['t' => 'projects'])}}" class="btn btn-default btn-lg" title="Show all projects">Show all projects</a>
            </div>
        </div>
    @endif
</div>
