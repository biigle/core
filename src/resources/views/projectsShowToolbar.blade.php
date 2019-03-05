@if ($volumes->isEmpty() && (!class_exists(Biigle\Modules\Videos\Video::class) || !Biigle\Modules\Videos\Video::where('project_id', $project->id)->exists()))
    <button class="btn btn-default" title="Reports cannot be generated for empty projects" disabled>
        <span class="fa fa-file" aria-hidden="true"></span> Request reports
    </button>
@else
    <a href="{{route('project-reports', $project->id)}}" class="btn btn-default" title="Request reports for this project">
        <span class="fa fa-file" aria-hidden="true"></span> Request reports
    </a>
@endif
