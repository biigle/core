@can('create', \Biigle\Project::class)
    <a href="{{route('projects-create')}}" class="btn btn-default" title="Create a new project">
        <i class="fa fa-users"></i> Create Project
    </a>
@else
    <button class="btn btn-default" title="Guests are not allowed to create new projects" disabled>
        <i class="fa fa-users"></i> Create Project
    </button>
@endcan
