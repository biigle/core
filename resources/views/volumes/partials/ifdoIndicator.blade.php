@if ($volume->hasIfdo())
    <a href="{{url("api/v1/volumes/{$volume->id}/ifdo")}}" class="btn btn-default btn-xs" title="Download the iFDO attached to this volume">iFDO</a>
@endif
