@extends('app')

@section('title') Create new project @stop

@section('content')
<div class="container">
	<div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
		<h2>New project</h2>
		<form class="clearfix" role="form" method="POST" action="{{ url('api/v1/projects') }}">
			<div class="form-group{{ $errors->has('name') ? ' has-error' : '' }}">
				<label for="name">Project name</label>
				<input type="text" class="form-control" name="name" id="name" value="">
				@if($errors->has('name'))
					<span class="help-block">{{ $errors->first('name') }}</span>
				@endif
			</div>

			<div class="form-group{{ $errors->has('description') ? ' has-error' : '' }}">
				<label for="description">Project description</label>
				<textarea class="form-control" name="description" id="description"></textarea>
				@if($errors->has('description'))
					<span class="help-block">{{ $errors->first('description') }}</span>
				@endif
			</div>
			<input type="hidden" name="_token" value="{{ csrf_token() }}">
			<a href="{{ route('home') }}" class="btn btn-link">Cancel</a>
			<input type="submit" class="btn btn-success pull-right" value="Create">
		</form>
	</div>
</div>
@endsection
