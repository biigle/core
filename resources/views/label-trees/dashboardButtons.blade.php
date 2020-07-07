@can('create', \Biigle\LabelTree::class)
    <a href="{{route('label-trees-create')}}" class="btn btn-default" title="Create a new label tree">
        <i class="fa fa-tags"></i> Create Label Tree
    </a>
@else
    <button class="btn btn-default" title="Guests are not allowed to create new label trees" disabled>
        <i class="fa fa-tags"></i> Create Label Tree
    </button>
@endcan
