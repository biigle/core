@can ('edit-in', $volume)
    <a href="{{route('largo', $volume->id)}}" class="btn btn-default volume-menubar__item" title="Perform Largo re-evaluation of annotations for this volume">
        <span class="glyphicon glyphicon-check" aria-hidden="true"></span>
    </a>
@endcan
