@extends('settings.base')

@section('title', 'Access tokens')

@section('settings-content')
<h2>API Tokens</h2>
<p>
    An API token can be used to authenticate external (automated) REST API requests. Learn more about the API in the <a href="{{url('doc/api/index.html')}}">documentation</a>.
</p>
<div class="panel panel-default">
    <div class="panel-body">
        @if ($token)
            <div class="alert alert-success" role="alert">
                <p>
                    Your API token was generated. It will be shown only this one time! Store it in your application and be sure not to disclose it to third parties.
                </p>
                <p>
                    <strong><pre class="text-success">{{$token->token}}</pre></strong>
                </p>
            </div>
        @endif
        @if ($deleted)
            <div class="alert alert-warning" role="alert">
                Your API token was successfully revoked.
            </div>
        @endif

        @if ($tokens->isEmpty())
            <p>
                You currently have no API tokens. Generate a new one to use the API.
            </p>
        @else
            <table class="table">
                <thead>
                    <tr>
                        <th>Purpose</th>
                        <th>Created</th>
                        <th>Used</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($tokens as $t)
                        <tr @if($token && $token->id === $t->id)class="success"@endif>
                            <td>{{$t->purpose}}</td>
                            <td>
                                <time datetime="{{$t->created_at->toAtomString()}}" title="{{$t->created_at->toDateTimeString()}}">
                                    {{$t->created_at->diffForHumans()}}
                                </time>
                            </td>
                            <td>
                                <time datetime="{{$t->updated_at->toAtomString()}}" title="{{$t->updated_at->toDateTimeString()}}">{{$t->updated_at->diffForHumans()}}</time>
                                <form class="pull-right" method="POST" action="{{ url('api/v1/api-tokens/'.$t->id) }}" onsubmit="return confirm('Do you really want to revoke the token?')">
                                    <input type="hidden" name="_method" value="DELETE">
                                    <input type="hidden" name="_token" value="{{ csrf_token() }}">
                                    <button type="submit" class="close" title="Revoke this token"><span aria-hidden="true">&times;</span></button>
                                </form>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif

        <h4>New token</h4>

        <form class="form-inline" role="form" method="POST" action="{{ url('api/v1/api-tokens') }}">
            <div class="form-group{{ $errors->has('purpose') ? ' has-error' : '' }}">
                <label class="sr-only" for="purpose">Purpose of the token</label>
                <input type="text" class="form-control" name="purpose" id="purpose" value="{{ $user->purpose }}" placeholder="Purpose of the token">
            </div>
            <input type="hidden" name="_method" value="POST">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <input type="submit" class="btn btn-success" value="Generate">
            @if($errors->has('purpose'))
                <div class="has-error">
                    <span class="help-block">{{ $errors->first('purpose') }}</span>
                </div>
            @endif
        </form>
    </div>
</div>
@mixin('settings.tokens')

@endsection
