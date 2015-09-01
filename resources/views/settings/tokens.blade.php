@extends('settings.base')

@section('title')Access tokens @stop

@section('settings-content')
<div class="panel panel-default">
    <div class="panel-heading">API token</div>
    <div class="panel-body">
        <p class="text-muted">
            The API token can be used to authenticate external (automated) REST API requests. Learn more about the API in the <a href="{{url('doc/api/index.html')}}">documentation</a>.
        </p>
        @if ($generated)
            <div class="alert alert-success" role="alert">
                Your API token was successfully generated.
            </div>
        @endif
        @if ($deleted)
            <div class="alert alert-success" role="alert">
                Your API token was successfully revoked.
            </div>
        @endif
        @if ($user->api_key === null)
            <p>
                You currently have no API token. Generate a new one to use the API.
            </p>
            <form class="" role="form" method="POST" action="{{ url('api/v1/users/my/token') }}">
                <input type="hidden" name="_method" value="POST">
                <input type="hidden" name="_token" value="{{ csrf_token() }}">
                <input type="submit" class="btn btn-success" value="Generate token">
            </form>
        @else
            <p class="text-muted">
                The token serves both as username and password so take care of who can access it!
            </p>
            <p class="token-toggle">
                <button class="btn btn-warning" onclick="showToken()">Show token</button>
            </p>
            <p class="token-toggle hidden">
                <strong>Your token</strong>
            </p>
            <pre class="token-toggle hidden">{{$user->api_key}}</pre>
            <form class="" role="form" method="POST" action="{{ url('api/v1/users/my/token') }}">
                <span class="help-block">By revoking your current token, all applications using it will losse the ability to access the COPRIA API.</span>
                <input type="hidden" name="_method" value="DELETE">
                <input type="hidden" name="_token" value="{{ csrf_token() }}">
                <input type="submit" class="btn btn-danger" value="Revoke token">
            </form>
<script type="text/javascript">
function showToken() {
    [].forEach.call(document.querySelectorAll('.token-toggle'), function(elm) {
        elm.classList.toggle('hidden');
    });
}
</script>
        @endif
    </div>
</div>
@endsection
