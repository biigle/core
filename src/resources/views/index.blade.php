@extends('app')

@section('title'){{ $transect->name }}@stop

@section('scripts')
<script src="{{ asset('vendor/transects/scripts/main.js') }}"></script>
@append

@section('styles')
<link href="{{ asset('vendor/transects/styles/main.css') }}" rel="stylesheet">
@append

@section('content')
<div class="container-fluid" data-ng-app="dias.transects">
	<h2 class="col-lg-12 clearfix">
		{{ $transect->name }} <small title="Transect ID {{ $transect->id }}">#{{ $transect->id }} ({{ $transect->images->count() }} images)</small>
	</h2>

	@foreach($transect->images as $image)
		<figure class="col-sm-3 col-md-2 transect-figure">
			<a href="{{ route('image', $image->id) }}">
				<img data-lazy-img="{{ url('api/v1/images/'.$image->id.'/thumb') }}">
			</a>
		</figure>
	@endforeach
</div>
@endsection
