@extends('app')
@inject('modules', 'Dias\Services\Modules')

@section('title') Annotate @stop

@section('scripts')
<script src="{{ asset('vendor/annotations/scripts/ol.js') }}"></script>
<script src="{{ asset('vendor/annotations/scripts/main.js') }}"></script>
<script type="text/javascript">
    angular.module('dias.annotations').constant('IMAGE_ID', {{$image->id}});
    angular.module('dias.annotations').constant('EDIT_MODE', {{$editMode ? 'true' : 'false'}});
    angular.module('dias.annotations').constant('PROJECT_IDS', [{{$projectIds}}]);
    angular.module('dias.annotations').constant('TRANSECT_ID', {{$image->transect->id}});
</script>
@foreach ($modules->getMixins('annotationsScripts') as $module => $nestedMixins)
    @include($module.'::annotationsScripts', ['mixins' => $nestedMixins])
@endforeach
@append

@section('styles')
<link href="{{ asset('vendor/annotations/styles/ol.css') }}" rel="stylesheet">
<link href="{{ asset('vendor/annotations/styles/main.css') }}" rel="stylesheet">
@foreach ($modules->getMixins('annotationsStyles') as $module => $nestedMixins)
    @include($module.'::annotationsStyles', ['mixins' => $nestedMixins])
@endforeach
@append

@section('content')
<div class="annotator__container" data-ng-app="dias.annotations" data-ng-controller="AnnotatorController">
	<div id="canvas" class="annotator__canvas" data-ng-controller="CanvasController">
		<div class="canvas__loader" data-ng-class="{active:imageLoading}"></div>
		@if ($editMode)
            {{--
			<div class="confidence-control" data-ng-controller="ConfidenceController" title="Label confidence: @{{ confidence | number:2 }}">
				<span class="label confidence-label" data-ng-class="confidenceClass" data-ng-bind="confidence | number:2"></span>
				<input class="confidence-range" type="range" min="0.01" max="1.0" step="0.01" data-ng-model="confidence">
			</div>
            --}}
            <div class="controls-bar">
                <div class="navigation-controls">

                </div>
                <div class="btn-group drawing-controls" data-ng-controller="DrawingControlsController" data-select-category="Please select a label category first.">
                    <button class="btn" data-ng-click="selectShape('Point')" data-ng-class="{active:(selectedShape()=='Point')}" title="Set a point 𝗔"><span class="icon icon-white icon-point" aria-hidden="true"></span></button>
                    <button class="btn" data-ng-click="selectShape('Rectangle')" data-ng-class="{active:(selectedShape()=='Rectangle')}" title="Draw a rectangle 𝗦"><span class="icon icon-white icon-rectangle" aria-hidden="true"></span></button>
                    <button class="btn" data-ng-click="selectShape('Circle')" data-ng-class="{active:(selectedShape()=='Circle')}" title="Draw a circle 𝗗"><span class="icon icon-white icon-circle" aria-hidden="true"></span></button>
                    <button class="btn" data-ng-click="selectShape('LineString')" data-ng-class="{active:(selectedShape()=='LineString')}" title="Draw a line string 𝗙, hold 𝗦𝗵𝗶𝗳𝘁 for freehand"><span class="icon icon-white icon-linestring" aria-hidden="true"></span></button>
                    <button class="btn" data-ng-click="selectShape('Polygon')" data-ng-class="{active:(selectedShape()=='Polygon')}" title="Draw a polygon 𝗚, hold 𝗦𝗵𝗶𝗳𝘁 for freehand"><span class="icon icon-white icon-polygon" aria-hidden="true"></span></button>
                </div>
                <div class="btn-group edit-controls" data-ng-controller="EditControlsController">
                    <button class="btn btn" title="Move selected annotations 𝗠" data-ng-click="moveSelectedAnnotations()" data-ng-class="{active:isMoving()}"><span class="glyphicon glyphicon-move" aria-hidden="true"></span></button>
                    <button class="btn" title="Delete selected annotations 𝗗𝗲𝗹" data-ng-click="deleteSelectedAnnotations()"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button>
                </div>
            </div>
            <div class="ng-cloak selected-label" data-ng-controller="SelectedLabelController" title="Currently selected label category" data-ng-bind="getSelectedLabel().name" data-ng-show="hasSelectedLabel()"></div>
		@endif
	</div>
	@include('annotations::index.sidebar')
</div>
@endsection
