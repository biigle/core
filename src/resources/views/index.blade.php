@extends('app')

@section('title') Annotate @stop

@section('scripts')
<script src="{{ asset('vendor/annotations/scripts/ol.js') }}"></script>
<script src="{{ asset('vendor/annotations/scripts/main.js') }}"></script>
@append

@section('styles')
<link href="{{ asset('vendor/annotations/styles/ol.css') }}" rel="stylesheet">
<link href="{{ asset('vendor/annotations/styles/main.css') }}" rel="stylesheet">
@append

@section('content')
<div class="annotator__container" data-ng-app="dias.annotations" data-ng-controller="AnnotatorController" data-image-id="{{ $image->id }}" data-transect-id="{{ $image->transect->id }}">
	<div id="canvas" class="annotator__canvas" data-ng-controller="CanvasController">
		<div class="canvas__loader" data-ng-class="{active:imageLoading}"></div>
		<div class="confidence-control" data-ng-controller="ConfidenceController" title="Label confidence: @{{ confidence | number:2 }}">
			<span class="label confidence-label" data-ng-class="confidenceClass" data-ng-bind="confidence | number:2"></span>
			<input class="confidence-range" type="range" min="0.01" max="1.0" step="0.01" data-ng-model="confidence">
		</div>
	</div>
	@include('annotations::index.sidebar')
</div>
@endsection
