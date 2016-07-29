@can ('edit-in', $transect)
    <a href="{{route('ate', $transect->id)}}" class="btn btn-default transect-menubar__item" title="Perform ATE re-evaluation of annotations for this transect">
        <span class="glyphicon glyphicon-check" aria-hidden="true"></span>
    </a>
@endcan
