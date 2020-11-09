@if ($hasFederatedSearch)
<form method="POST" action="{{ url('api/v1/users/my/settings') }}" class="pull-right federated-search-button">
    <input type="hidden" name="_redirect" value="{{url()->full()}}">
    <input type="hidden" name="_method" value="PUT">
    <input type="hidden" name="_token" value="{{ csrf_token() }}">
    @if ($includeFederatedSearch)
        <input type="hidden" name="include_federated_search" value="0">
        <button type="submit" class="btn btn-default btn-sm active btn-info" title="Hide search results from other BIIGLE instances"><i class="fa fa-external-link-alt"></i></button>
    @else
        <input type="hidden" name="include_federated_search" value="1">
        <button type="submit" class="btn btn-default btn-sm" title="Show search results from other BIIGLE instances"><i class="fa fa-external-link-alt"></i></button>
    @endif
</form>
@endif
