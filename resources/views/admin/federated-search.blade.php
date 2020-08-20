@extends('admin.base')

@section('title', 'Federated search admin area')

@section('admin-content')
<div class="row">
    <div class="col-xs-6">
        <h4>Connected instances</h4>
        <div class="list-group">
            @forelse ($instances as $instance)
                <a href="{{route('admin-federated-search', ['edit' => $instance->id])}}" class="list-group-item @if ($editInstance && $editInstance->id === $instance->id) list-group-item-info @endif" title="Edit this instance">
                    <h4 class="list-group-item-heading clearfix">
                        {{$instance->name}}
                        <span class="pull-right">
                            @if ($instance->local_token)
                                <span class="label label-success" title="The remote instance may retrieve the local search index">access</span>
                            @else
                                <span class="label label-default" title="The remote instance may not retrieve the local search index"><s>access</s></span>
                            @endif
                            @if ($instance->remote_token)
                                <span class="label label-success" title="The local instance retrieves the remote search index">indexing</span>
                            @else
                                <span class="label label-default" title="The local instance does not retrieve the remote search index"><s>indexing</s></span>
                            @endif
                        </span>
                    </h4>
                    <p class="list-group-item-text text-muted">
                        {{$instance->url}}
                    </p>
                </a>
            @empty
                <div class="list-group-item text-muted">
                    There are no remote instances connected for federated search.
                </div>
            @endforelse
        </div>
    </div>
    <div class="col-xs-6">
        @if ($editInstance)
            <form method="POST" action="{{ url("api/v1/federated-search-instances/{$editInstance->id}") }}" id="edit-form">
                <div>
                    <h4>Edit {{$editInstance->name}}</h4>
                </div>
                <div class="row">
                    <div class="col-sm-6">
                        <div class="form-group{{ $errors->has('name') ? ' has-error' : '' }}">
                            <input type="text" class="form-control" name="name" id="name" value="{{ old('name', $editInstance->name) }}" placeholder="Instance name" required>
                            @if($errors->has('name'))
                                <span class="help-block">{{ $errors->first('name') }}</span>
                            @endif
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div class="form-group{{ $errors->has('url') ? ' has-error' : '' }}">
                            <input type="url" class="form-control" name="url" id="url" value="{{ old('url', $editInstance->url) }}" placeholder="https://example.com" required>
                            @if($errors->has('url'))
                                <span class="help-block">{{ $errors->first('url') }}</span>
                            @endif
                        </div>
                    </div>
                </div>
                <input type="hidden" name="_redirect" value="{{ route('admin-federated-search', ['edit' => $editInstance->id]) }}">
                <input type="hidden" name="_token" value="{{ csrf_token() }}">
                <input type="hidden" name="_method" value="put">
            </form>
            <form method="POST" action="{{ url("api/v1/federated-search-instances/{$editInstance->id}") }}">
                <div class="row">
                    @if ($editInstance->remote_token)
                        <div class="col-sm-8">
                            <div class="form-group">
                                <input type="password" class="form-control" name="remote_token" id="remote_token" value="" disabled>
                            </div>
                        </div>
                        <div class="col-sm-4">
                            <input type="submit" class="btn btn-default btn-block" value="Disable indexing" title="Disable indexing of the remote search index">
                        </div>
                    @else
                        <div class="col-sm-8">
                            <div class="form-group{{ $errors->has('remote_token') ? ' has-error' : '' }}">
                                <input type="password" class="form-control" name="remote_token" id="remote_token" value="" placeholder="Token from the remote instance" required>
                                @if($errors->has('remote_token'))
                                    <span class="help-block">{{ $errors->first('remote_token') }}</span>
                                @endif
                            </div>
                        </div>
                        <div class="col-sm-4">
                            <input type="submit" class="btn btn-default btn-block" value="Enable indexing" title="Enable indexing of the remote search index">
                        </div>
                    @endif
                </div>
                <input type="hidden" name="_redirect" value="{{ route('admin-federated-search', ['edit' => $editInstance->id]) }}">
                <input type="hidden" name="_token" value="{{ csrf_token() }}">
                <input type="hidden" name="_method" value="put">
            </form>
            <div class="row">
                <div class="col-sm-4">
                    <form method="POST" action="{{ url("api/v1/federated-search-instances/{$editInstance->id}") }}">
                        <div class="form-group">
                            @if ($editInstance->local_token)
                                <input type="hidden" name="local_token" value="0">
                                <input type="submit" class="btn btn-default btn-block" value="Deny access" title="Deny the instance to retrieve the local search index">
                            @else
                                <input type="hidden" name="local_token" value="1">
                                <input type="submit" class="btn btn-default btn-block" value="Allow access" title="Allow the instance to retrieve the local search index">
                            @endif
                        </div>
                        <input type="hidden" name="_redirect" value="{{ route('admin-federated-search', ['edit' => $editInstance->id]) }}">
                        <input type="hidden" name="_token" value="{{ csrf_token() }}">
                        <input type="hidden" name="_method" value="put">
                    </form>
                </div>
                <div class="col-sm-4">
                    <form method="POST" action="{{ url("api/v1/federated-search-instances/{$editInstance->id}") }}">
                        <div class="form-group">
                            <input type="submit" class="btn btn-danger btn-block" value="Delete" title="Delete this instance">
                        </div>
                        <input type="hidden" name="_redirect" value="{{ route('admin-federated-search') }}">
                        <input type="hidden" name="_token" value="{{ csrf_token() }}">
                        <input type="hidden" name="_method" value="delete">
                    </form>
                </div>
                <div class="col-sm-4 form-group">
                    <button type="submit" form="edit-form" class="btn btn-success btn-block" title="Save changes">Save</button>
                </div>
            </div>
            @if (session('new_local_token'))
                <div class="panel panel-success">
                    <div class="panel-body bg-success text-success">
                        <p>
                            Use this token to enable indexing in the remote instance:
                        </p>
                        <pre>{{session('new_local_token')}}</pre>
                    </div>
                </div>
            @endif
        @else
            <form method="POST" action="{{ url('api/v1/federated-search-instances') }}">
                <div>
                    <h4>Connect a new instance</h4>
                </div>
                <div class="row">
                    <div class=" col-sm-6 form-group{{ $errors->has('name') ? ' has-error' : '' }}">
                        <input type="text" class="form-control" name="name" id="name" value="{{ old('name') }}" placeholder="Instance name" required>
                        @if($errors->has('name'))
                            <span class="help-block">{{ $errors->first('name') }}</span>
                        @endif
                    </div>
                    <div class=" col-sm-6 form-group{{ $errors->has('url') ? ' has-error' : '' }}">
                        <input type="url" class="form-control" name="url" id="url" value="{{ old('url') }}" placeholder="https://example.com" required>
                        @if($errors->has('url'))
                            <span class="help-block">{{ $errors->first('url') }}</span>
                        @endif
                    </div>
                    <div class="col-sm-4 col-sm-offset-8">
                        <input type="submit" class="btn btn-success btn-block" value="Connect" title="Connect the new remote instance">
                    </div>
                </div>
                <input type="hidden" name="_token" value="{{ csrf_token() }}">
            </form>
        @endif
    </div>
</div>



{{-- <a href="{{route('admin-users-new')}}" class="btn btn-default" title="Create a new user">New user</a>
<table class="table table-hover">
    <thead>
        <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Affiliation</th>
            <th>Activity</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($users as $u)
            <tr>
                <td>
                    <a href="{{route('admin-users-show', $u->id)}}">{{$u->firstname}} {{$u->lastname}}</a>
                </td>
                <td><a href="mailto:{{$u->email}}">{{$u->email}}</a></td>
                <td>
                    <span class="label label-{{$roleClass[$u->role_id]}}" title="{{$roleNames[$u->role_id]}}">{{$roleNames[$u->role_id][0]}}</span>
                </td>
                <td>
                    @if ($u->affiliation)
                        <span title="{{$u->affiliation}}">{{Str::limit($u->affiliation, 20)}}</span>
                    @else
                        <span class="text-muted">none</span>
                    @endif
                </td>
                <td>
                    @if ($u->login_at)
                        <time datetime="{{$u->login_at->toAtomString()}}" title="{{$u->login_at->toDateTimeString()}}">{{$u->login_at->diffForHumans()}}</time>
                    @else
                        <span class="text-muted">none</span>
                    @endif
                </td>
            </tr>
        @endforeach
    </tbody>
</table>
<nav class="text-center">
    {{$users->links()}}
</nav>
 --}}
@endsection
