@can('edit-in', $project)
    <a href="{{route('projectsLargo', $project->id)}}" class="btn btn-default" title="Perform Largo re-evaluation of annotations for this project"><span class="glyphicon glyphicon-check" aria-hidden="true"></span> Largo re-evaluation</a>
@endcan
