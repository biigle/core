@extends('app')

@section('title'){{ $transect->name }}@stop

@section('scripts')
<script src="{{ asset('vendor/transects/scripts/main.js') }}"></script>
@append

@section('styles')
<link href="{{ asset('vendor/transects/styles/main.css') }}" rel="stylesheet">
@append

@section('content')
<div class="transect-container container-fluid" data-ng-app="dias.transects">
	<h2 class="col-xs-12 clearfix">
		{{ $transect->name }} <small title="Transect ID {{ $transect->id }}">#{{ $transect->id }} ({{ $transect->images->count() }} images)</small>
	</h2>

	<div class="col-xs-12 images-container" data-ng-controller="ImagesController" data-transect-id="{{ $transect->id }}" data-image-url="{{ route('image', '') }}" data-api-url="{{ url('api/v1/images/') }}">

		<figure class="transect-figure" data-ng-repeat="id in images | limitTo: limit">
			<a href="@{{ imageUrl }}/@{{ id }}">
				<img data-ng-src="@{{ apiUrl }}/@{{ id }}/thumb">
			</a>
		</figure>
	</div>
</div>
@endsection
