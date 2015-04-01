@extends('app')

@section('title') Annotate @stop

@section('scripts')
<script src="{{ asset('vendor/annotations/scripts/main.js') }}"></script>
@append

@section('styles')
<link href="{{ asset('vendor/annotations/styles/main.css') }}" rel="stylesheet">
@append

@section('content')
<div class="annotator__container" data-ng-app="dias.annotations" data-ng-controller="AnnotatorController" data-image-id="{{ $image->id }}" data-transect-id="{{ $image->transect->id }}">
	<div class="annotator__canvas" data-ng-controller="CanvasController" data-ng-mousemove="updateMouse($event)">
		<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink= "http://www.w3.org/1999/xlink" class="canvas__svg" data-ng-attr-height="@{{height}}" data-ng-attr-width="@{{width}}" data-ng-controller="SVGController">
			<defs>
				<circle id="marker" data-ng-attr-r="@{{10 / scale}}" fill="red"/>
			</defs>
			<g data-ng-attr-transform="translate(@{{scaleTranslateX}}, @{{scaleTranslateY}}) scale(@{{scale}}) translate(@{{translateX}}, @{{translateY}})">
				<image xlink:href="" data-ng-attr-xlink:href="@{{image.src}}" data-ng-attr-height="@{{height}}" data-ng-attr-width="@{{width}}" data-ng-repeat="image in images.buffer | filter: {_show: true}" data-ng-index="@{{image._index}}"/>
				<use xlink:href="#marker" data-ng-attr-transform="translate(@{{relativeMouseX}}, @{{relativeMouseY}})"/>
			</g>

			<image data-ng-if="images.loading" x="0" y="0" width="50" height="50" xlink:href="{{ asset('assets/images/dias_Jelly-Fish.png') }}" data-ng-attr-transform="translate(-25, -25) translate(@{{width/2}}, @{{height/2}})">
				<animate attributeName="y" calcMode="spline" dur="1s" repeatCount="indefinite" from="30" to="30" values="30;-30;30" keySplines="0.4 0.8 0.4 0.8;0.8 0.4 0.8 0.4" keyTimes="0;0.5;1"></animate>
			</image>
		</svg>
	</div>
	<div class="annotator__sidebar">
		<button data-ng-click="images.prev()">&lt;</button>
		<button data-ng-click="images.next()">&gt;</button>
	</div>
</div>
@endsection
