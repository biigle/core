@extends('app')
@inject('modules', 'Dias\Services\Modules')

@section('title') Annotate @stop

@push('scripts')
<script src="{{ asset('vendor/annotations/scripts/ol.js') }}"></script>
<script src="{{ asset('vendor/annotations/scripts/main.js') }}"></script>
<script type="text/javascript">
    angular.module('dias.annotations').constant('IMAGE_ID', {{$image->id}});
    angular.module('dias.annotations').constant('EDIT_MODE', {{$editMode ? 'true' : 'false'}});
    angular.module('dias.annotations').constant('PROJECT_IDS', [{{$projectIds}}]);
    angular.module('dias.annotations').constant('TRANSECT_ID', {{$image->transect_id}});
    angular.module('dias.annotations').constant('TRANSECT_IMAGES_IDS', {{$transectImagesIds}});
</script>
@foreach ($modules->getMixins('annotationsScripts') as $module => $nestedMixins)
    @include($module.'::annotationsScripts', ['mixins' => $nestedMixins])
@endforeach
@endpush

@push('styles')
<link href="{{ asset('vendor/annotations/styles/ol.css') }}" rel="stylesheet">
<link href="{{ asset('vendor/annotations/styles/main.css') }}" rel="stylesheet">
@foreach ($modules->getMixins('annotationsStyles') as $module => $nestedMixins)
    @include($module.'::annotationsStyles', ['mixins' => $nestedMixins])
@endforeach
@endpush

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
                {{--@include('annotations::index.navigationControls')--}}
                @include('annotations::index.drawingControls')
                @include('annotations::index.editControls')
            </div>
            <div class="ng-cloak selected-label" data-ng-controller="SelectedLabelController" title="Currently selected label category" data-ng-bind="getSelectedLabel().name" data-ng-show="hasSelectedLabel()"></div>
		@endif
	</div>
	@include('annotations::index.sidebar')
</div>
@endsection
