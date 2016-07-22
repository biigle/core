@extends('app')

@section('title') Create new transect @stop

@section('content')
<div class="container" data-ng-app="">
	<div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
		<h2>New transect for {{ $project->name }}</h2>
		<form class="clearfix" role="form" method="POST" action="{{ url('api/v1/projects/'.$project->id.'/transects') }}" data-ng-submit="submitted=true">
			<div class="form-group{{ $errors->has('name') ? ' has-error' : '' }}">
				<label for="name">Transect name</label>
				<input type="text" class="form-control" name="name" id="name" value="{{ old('name') }}" required>
				@if($errors->has('name'))
					<span class="help-block">{{ $errors->first('name') }}</span>
				@endif
			</div>

			<div class="form-group{{ $errors->has('url') ? ' has-error' : '' }}">
				<label for="url">Transect url</label>
				<input type="text" class="form-control" name="url" id="url" value="{{ old('url') }}" required>
				<p class="help-block">
					The directory containing the transect images. {{--Can be local like <code>/vol/images/transect</code> or remote like <code>https://my-domain.tld/transect</code>.--}}Should be a local path like <code>/vol/images/transect</code>.
				</p>
				@if($errors->has('url'))
					<span class="help-block">{{ $errors->first('url') }}</span>
				@endif
			</div>

			<div class="form-group{{ $errors->has('media_type_id') ? ' has-error' : '' }}">
				<label for="media_type_id">Transect media type</label>
				<select class="form-control" name="media_type_id" id="media_type_id" required>
					@foreach($mediaTypes as $mediaType)
						<option{!! old('media_type_id') == $mediaType->id ? ' selected="selected"' : '' !!} value="{{ $mediaType->id }}">{{ trans('dias.media_types.'.$mediaType->name) }}</option>
					@endforeach
				</select>
				@if($errors->has('media_type_id'))
					<span class="help-block">{{ $errors->first('media_type_id') }}</span>
				@endif
			</div>

			<div class="form-group{{ $errors->has('images') ? ' has-error' : '' }}">
				<label for="images">Transect images</label>
				<textarea class="form-control" name="images" id="images" required>{{ old('images') }}</textarea>
				<p class="help-block">
					The filenames of the transect images in the directory of the transect URL formatted as comma separated values. Example: <code>1.jpg, 2.jpg, 3.jpg</code>.<br>
                    The supported image file formats are: JPG, PNG and GIF.
				</p>
				@if($errors->has('images'))
					<span class="help-block">{{ $errors->first('images') }}</span>
				@endif
			</div>

			<input type="hidden" name="_token" value="{{ csrf_token() }}">
			<a href="{{ URL::previous() }}" class="btn btn-link" data-ng-disabled="submitted">Cancel</a>
			<input type="submit" class="btn btn-success pull-right" value="Create" data-ng-disabled="submitted">
			</div>
		</form>
	</div>
</div>
@endsection
