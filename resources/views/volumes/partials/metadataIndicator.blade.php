@if ($volume->hasMetadata())
    <a href="{{url("api/v1/volumes/{$volume->id}/metadata")}}" class="btn btn-default btn-xs" title="Download the metadata file attached to this volume">
        <i class="fa fa-file-alt fa-fw"></i>
    </a>
@endif
