@extends('app')

@section('title')@parent {{ trans('dias.titles.settings') }} @stop

@section('content')
<div class="container">
	<div class="row">
		<div class="col-lg-6 col-lg-offset-3">
			<h1>Settings</h1>
			<div class="panel panel-default">
				<div class="panel-heading">Profile</div>
				<div class="panel-body">
					<form class="clearfix" role="form" method="POST" action="{{ url('api/v1/users/my') }}">
						<input type="hidden" name="_method" value="put" />
						<div class="form-group{{ $errors->has('email') ? ' has-error' : '' }}">
							<label for="email">Email address</label>
							<input type="email" class="form-control" name="email" id="email" value="{{ $user->email }}">
							@if($errors->has('email'))
								<span class="help-block">{{ $errors->first('email') }}</span>
							@endif
						</div>

						<div class="form-group{{ $errors->has('firstname') ? ' has-error' : '' }}">
							<label for="firstname">First name</label>
							<input type="text" class="form-control" name="firstname" id="firstname" value="{{ $user->firstname }}">
							@if($errors->has('firstname'))
								<span class="help-block">{{ $errors->first('firstname') }}</span>
							@endif
						</div>

						<div class="form-group{{ $errors->has('lastname') ? ' has-error' : '' }}">
							<label for="lastname">Last name</label>
							<input type="text" class="form-control" name="lastname" id="lastname" value="{{ $user->lastname }}">
							@if($errors->has('lastname'))
								<span class="help-block">{{ $errors->first('lastname') }}</span>
							@endif
						</div>

						<div class="form-group{{ $errors->has('old_password') ? ' has-error' : '' }}">
							<label for="old_password">Old password</label>
							<input type="password" class="form-control" name="old_password" id="old_password">
							@if($errors->has('old_password'))
								<span class="help-block">{{ $errors->first('old_password') }}</span>
							@endif
						</div>

						<div class="form-group{{ $errors->has('password') ? ' has-error' : '' }}">
							<label for="password">New password</label>
							<input type="password" class="form-control" name="password" id="password">
							@if($errors->has('password'))
								<span class="help-block">{{ $errors->first('password') }}</span>
							@endif
						</div>

						<div class="form-group{{ $errors->has('password_confirmation') ? ' has-error' : '' }}">
							<label for="password_confirmation">Confirm new password</label>
							<input type="password" class="form-control" name="password_confirmation" id="password_confirmation">
							@if($errors->has('password_confirmation'))
								<span class="help-block">{{ $errors->first('password_confirmation') }}</span>
							@endif
						</div>

						<input type="hidden" name="_token" value="{{ csrf_token() }}">
						<input type="submit" class="btn btn-success" value="Update profile">
					</form>
				</div>
			</div>
		</div>
	</div>
</div>
@endsection
