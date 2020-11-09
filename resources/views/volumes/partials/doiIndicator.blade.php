@if ($volume->doi)
    <a href="https://doi.org/{{$volume->doi}}" class="btn btn-default btn-xs" title="DOI: {{$volume->doi}}"><span class="fa fa-link" aria-hidden="true" ></span></a>
@endif
