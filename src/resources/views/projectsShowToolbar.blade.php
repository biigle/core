@can('edit-in', $project)
    @if ($project->imageVolumes()->exists())
        <a href="{{route('projectsLargo', $project->id)}}" class="btn btn-default" title="Perform Largo re-evaluation of annotations for this project"><span class="fa fa-check-square" aria-hidden="true"></span> Largo re-evaluation</a>
    @endif
@endcan
