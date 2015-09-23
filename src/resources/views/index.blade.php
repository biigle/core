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
<div class="annotator__container" data-ng-app="dias.annotations" data-ng-controller="AnnotatorController" data-image-id="{{ $image->id }}" data-transect-id="{{ $image->transect->id }}" data-edit-mode="{{ $editMode }}" data-project-ids="{{ $projectIds }}">
	<div id="canvas" class="annotator__canvas" data-ng-controller="CanvasController">
		<div class="canvas__loader" data-ng-class="{active:imageLoading}"></div>
		@if ($editMode)
			<div class="confidence-control" data-ng-controller="ConfidenceController" title="Label confidence: @{{ confidence | number:2 }}">
				<span class="label confidence-label" data-ng-class="confidenceClass" data-ng-bind="confidence | number:2"></span>
				<input class="confidence-range" type="range" min="0.01" max="1.0" step="0.01" data-ng-model="confidence">
			</div>
            <div class="drawing-controls-container">
                <div class="btn-group drawing-controls" data-ng-controller="ControlsController" data-select-category="Please select a label category first.">
                    <button class="btn icon icon-white icon-point" data-ng-click="selectShape('Point')" data-ng-class="{active:(selectedShape=='Point')}" title="Set a point 𝗔"></button>
                    <button class="btn icon icon-white icon-rectangle" data-ng-click="selectShape('Rectangle')" data-ng-class="{active:(selectedShape=='Rectangle')}" title="Draw a rectangle 𝗦"></button>
                    <button class="btn icon icon-white icon-circle" data-ng-click="selectShape('Circle')" data-ng-class="{active:(selectedShape=='Circle')}" title="Draw a circle 𝗗"></button>
                    <button class="btn icon icon-white icon-linestring" data-ng-click="selectShape('LineString')" data-ng-class="{active:(selectedShape=='LineString')}" title="Draw a line string 𝗙"></button>
                    <button class="btn icon icon-white icon-polygon" data-ng-click="selectShape('Polygon')" data-ng-class="{active:(selectedShape=='Polygon')}" title="Draw a polygon 𝗚"></button>
                </div>
            </div>
            <div class="selected-label-container" data-ng-controller="SelectedLabelController" title="Currently selected label category" data-ng-bind="getSelectedLabel().name"></div>
		@endif
	</div>
	@include('annotations::index.sidebar')
</div>
@endsection
