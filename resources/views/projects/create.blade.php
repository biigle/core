@extends('app')

@section('title', 'Create new project')

@section('content')
<div class="container">
	<div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
		<h2>New project</h2>
		<form class="clearfix" role="form" method="POST" action="{{ url('api/v1/projects') }}">
			<div class="form-group{{ $errors->has('name') ? ' has-error' : '' }}">
				<label for="name">Project name</label>
				<input type="text" class="form-control" name="name" id="name" value="{{ old('name') }}" autofocus required>
				@if($errors->has('name'))
					<span class="help-block">{{ $errors->first('name') }}</span>
				@endif
			</div>

			<div class="form-group{{ $errors->has('description') ? ' has-error' : '' }}">
				<label for="description">Project description</label>
                <input type="text" class="form-control" name="description" id="description" value="{{ old('description') }}" required>
				@if($errors->has('description'))
					<span class="help-block">{{ $errors->first('description') }}</span>
				@endif
			</div>
			<input type="hidden" name="_token" value="{{ csrf_token() }}">
			<a href="{{ URL::previous() }}" class="btn btn-link">Cancel</a>
			<input id="submit-button" type="submit" class="btn btn-success pull-right" value="Create" onclick="this.disabled = true;this.value = 'Creating project...';this.form.submit();">
		</form>
	</div>
</div>
@endsection