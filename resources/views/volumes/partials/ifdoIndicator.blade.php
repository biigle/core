@if ($volume->hasIfdo(true))
    <a href="{{url("api/v1/volumes/{$volume->id}/ifdo")}}" class="btn btn-default btn-xs" title="Download the iFDO attached to this volume">
        <img class="ifdo-icon" src="{{ cachebust_asset('assets/images/ifdo_logo_grey.svg') }}"> iFDO
    </a>
@endif
