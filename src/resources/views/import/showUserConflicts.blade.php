@extends('admin.base')

@section('title', 'User Import')

@section('admin-content')
<div class="row">
    <h2>User Import</h2>
    <div class="panel panel-danger">
        <div class="panel-body text-danger">
            The following import users have the same email address but a different UUID than existing users. Please check if these are the same users and update their UUID accordingly. Then request the import again.
        </div>
        <table class="table">
            <thead>
                <tr>
                    <th>Import</th>
                    <th>Existing</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($conflictingImportUsers as $u)
                    <tr>
                        <td>
                            {{$u['firstname']}} {{$u['lastname']}} <span class="text-muted">({{$u['email']}})</span><br><code>{{$u['uuid']}}</code>
                        </td>
                        <td>
                            <?php $u = $conflictingExistingUsers->get($u['email']); ?>
                            <a href="{{route('admin-users-edit', $u->id)}}" target="_blank">{{$u->firstname}} {{$u->lastname}}</a> <span class="text-muted">({{$u->email}})</span><br><code>{{$u->uuid}}</code>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    <form method="post" action="{{url('api/v1/import/'.$token)}}">
        <input type="hidden" name="_method" value="DELETE">
        <input type="hidden" name="_token" value="{{ csrf_token() }}">
        <button class="btn btn-success pull-right">Okay</button>
    </form>
</div>
@endsection
