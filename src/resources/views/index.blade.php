@extends('app')

@section('title') Annotate @stop

@section('scripts')
<script src="{{ asset('vendor/annotations/scripts/main.js') }}"></script>
@append

@section('styles')
<link href="{{ asset('vendor/annotations/styles/main.css') }}" rel="stylesheet">
@append

@section('content')
<div class="annotator__container" data-ng-app="dias.annotations" data-ng-controller="AnnotatorController">
	<div class="annotator__canvas" data-ng-controller="CanvasController" data-ng-mousemove="updateMouse($event)">
		<svg version="1.1"
     xmlns="http://www.w3.org/2000/svg" xmlns:xlink= "http://www.w3.org/1999/xlink" class="canvas__svg" data-ng-height="@{{height}}" data-ng-width="@{{width}}" data-ng-controller="SVGController">
     		<defs>
     	{{-- marker definition so radius is updated only on a single element --}}
     			<circle id="marker" data-ng-r="@{{10 / scale}}" fill="red"/>
     		</defs>
			<g data-ng-transform="translate(@{{scaleTranslateX}}, @{{scaleTranslateY}}) scale(@{{scale}}) translate(@{{translateX}}, @{{translateY}})">
				<image xlink:href="{{ url('api/v1/images/'.$image->id.'/file') }}" x="0" y="0" data-ng-height="@{{height}}" data-ng-width="@{{width}}"
				/>
				<use xlink:href="#marker" data-ng-x="@{{relativeMouseX}}" data-ng-y="@{{relativeMouseY}}"/>
			</g>
		</svg>
	</div>
</div>
@endsection
