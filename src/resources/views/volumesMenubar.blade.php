@can ('edit-in', $volume)
    <a href="{{route('ate', $volume->id)}}" class="btn btn-default volume-menubar__item" title="Perform ATE re-evaluation of annotations for this volume">
        <span class="glyphicon glyphicon-check" aria-hidden="true"></span>
    </a>
@endcan
