@extends('admin.base')

@section('title', 'Users admin area - Delete user')

@section('admin-content')
<h4>Delete {{$affectedUser->firstname}} {{$affectedUser->lastname}}</h4>
<p>
    <strong>Full Name:</strong> {{$affectedUser->firstname}} {{$affectedUser->lastname}}<br>
    <strong>Email:</strong> {{$affectedUser->email}}<br>
    <strong>Affiliation:</strong> {{$affectedUser->affiliation}}
</p>

<p class="text-danger">
    Deleting a user account won't delete any of its projects, volumes or annotations etc. (they just won't be associated with it any more).
</p>
<p class="text-danger">
    <strong>Deleting a user account cannot be undone!</strong>
</p>



<form role="form" method="POST" action="{{ url('api/v1/users/'.$affectedUser->id) }}">
    <input type="hidden" name="_method" value="DELETE">
    <input type="hidden" name="_token" value="{{ csrf_token() }}">
    <input type="hidden" name="_redirect" value="{{ route('admin-users') }}">

    <div class="form-group{{ $errors->has('password') ? ' has-error' : ''}}">
        <label for="password">Your Password</label>
        <input type="password" class="form-control" name="password" id="password">
        @if($errors->has('password'))
            <span class="help-block">{{ $errors->first('password') }}</span>
        @endif
        <span class="help-block">Confirm the deletion of the user account with your password.</span>
    </div>

    <a href="{{ route('admin-users') }}" class="btn btn-link">Cancel</a>
    <button type="submit" class="btn btn-danger pull-right" id="delete-button">Confirm deleting <strong>{{$affectedUser->firstname}} {{$affectedUser->lastname}}</strong></button>
</form>
@endsection
