@if ($projects->isNotEmpty())
<div class="dashboard-projects" id="projects-dashboard-main">
    @foreach ($projects as $project)
       <div class="row dashboard-project">

            <h4 class="col-xs-12">
                @if ($project->pivot->pinned)
                    <i class="fa fa-thumbtack text-muted" title="This project has been pinned to the dashboard"></i>
                @endif
                <a href="{{route('project', $project->id)}}" title="Show project {{$project->name}}">
                    {{$project->name}}
                </a>
            </h4>

            <?php
                $items = $project->volumes()
                    ->orderBy('created_at', 'desc')
                    ->limit(4)
                    ->get();

                if (class_exists(Biigle\Modules\Videos\Video::class)) {
                    $videos = Biigle\Modules\Videos\Video::where('project_id', $project->id)
                        ->orderBy('created_at', 'desc')
                        ->limit(4)
                        ->get();
                    $items = $items->concat($videos)
                        ->sortByDesc('created_at')
                        ->take(4);
                }
            ?>
            @forelse ($items as $item)
                <div class="col-xs-12 col-sm-6 col-md-3">
                    @include('projects::partials.dashboardPreviewItem')
                </div>
            @empty
                <div class="col-xs-12">
                    <div class="text-muted">
                        This project is empty.
                    </div>
                </div>
            @endforelse

        </div>
    @endforeach
</div>
<div class="row">
    <div class="col-xs-12 dashboard__all-projects">
        <a href="{{route('search', ['t' => 'projects'])}}" class="btn btn-default btn-lg" title="Show all projects">Show all projects</a>
    </div>
</div>
@else
    <div class="row">
        <div class="col-md-8 col-md-offset-2">
            <div class="text-info text-center well">
                You do not belong to any projects yet.<br>You can @can ('create', Biigle\Project::class) <a href="{{route('projects-create')}}">create your own project</a> or @endcan request a project admin to add you to a project.
            </div>
        </div>
    </div>
@endif
