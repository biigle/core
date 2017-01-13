@extends('app')
@inject('modules', 'Biigle\Services\Modules')

@section('title') Annotate @stop

@push('scripts')
<script src="{{ cachebust_asset('vendor/annotations/scripts/ol.js') }}"></script>
<script src="{{ cachebust_asset('vendor/annotations/scripts/glfx.js') }}"></script>
<script src="{{ cachebust_asset('vendor/annotations/scripts/main.js') }}"></script>
<script type="text/javascript">
    angular.module('biigle.annotations').constant('IMAGE_ID', {!!$image->id!!});
    angular.module('biigle.annotations').constant('EDIT_MODE', {!!$editMode ? 'true' : 'false'!!});
    angular.module('biigle.annotations').constant('USER_ID', {!!$user->id!!});
    angular.module('biigle.annotations').constant('VOLUME_ID', {!!$image->volume_id!!});
    angular.module('biigle.annotations').constant('IMAGES_IDS', {!!$images->keys()!!});
    angular.module('biigle.annotations').constant('IMAGES_FILENAMES', {!!$images->values()!!});
    angular.module('biigle.annotations').constant('SHAPES', {!!$shapes!!});
    angular.module('biigle.annotations').constant('ANNOTATION_SESSIONS', {!!$annotationSessions!!});
    @if($editMode)
        angular.module('biigle.annotations').constant('LABEL_TREES', {!!$labelTrees!!});
    @else
        angular.module('biigle.annotations').constant('LABEL_TREES', []);
    @endif
</script>
@foreach ($modules->getMixins('annotationsScripts') as $module => $nestedMixins)
    @include($module.'::annotationsScripts', ['mixins' => $nestedMixins])
@endforeach
@endpush

@push('styles')
<link href="{{ cachebust_asset('vendor/annotations/styles/ol.css') }}" rel="stylesheet">
<link href="{{ cachebust_asset('vendor/annotations/styles/main.css') }}" rel="stylesheet">
@foreach ($modules->getMixins('annotationsStyles') as $module => $nestedMixins)
    @include($module.'::annotationsStyles', ['mixins' => $nestedMixins])
@endforeach
@endpush

@section('navbar')
<div class="navbar-text navbar-annotations-breadcrumbs">
    @include('volumes::partials.projectsBreadcrumb', ['projects' => $volume->projects])/ <a href="{{route('volume', $volume->id)}}" class="navbar-link" title="Show volume {{$volume->name}}">{{$volume->name}}</a>
    / <strong class="navbar-annotations-filename" title="{{$image->filename}}">{{$image->filename}}</strong> @include('volumes::partials.annotationSessionIndicator')
</div>
@endsection

@section('content')
<div class="annotator__container" data-ng-app="biigle.annotations" data-ng-controller="AnnotatorController">
    <div id="canvas" class="annotator__canvas" data-ng-controller="CanvasController">
        <div class="canvas__loader" data-ng-class="{active:imageLoading}"></div>
            {{--
            @if ($editMode)
                <div class="confidence-control" data-ng-controller="ConfidenceController" title="Label confidence: @{{ confidence | number:2 }}">
                    <span class="label confidence-label" data-ng-class="confidenceClass" data-ng-bind="confidence | number:2"></span>
                    <input class="confidence-range" type="range" min="0.01" max="1.0" step="0.01" data-ng-model="confidence">
                </div>
            @endif
            --}}
            <div class="ng-cloak mouse-position" data-ng-controller="MousePositionController" title="Mouse position on the image" data-ng-show="shown()">
                <span data-ng-bind="position[0]"></span> &times; <span data-ng-bind="position[1]"></span>
            </div>
            <div class="controls-bar">
                @include('annotations::index.controls.navigation')
                @if ($editMode)
                    @include('annotations::index.controls.drawing')
                    @include('annotations::index.controls.edit')
                @endif
            </div>
            @if ($editMode)
                <div class="ng-cloak selected-label" data-ng-controller="SelectedLabelController" title="Currently selected label" data-ng-bind="getSelectedLabel().name" data-ng-show="hasSelectedLabel()"></div>
            @endif
            <div class="fullscreen__minimap" data-ng-controller="MinimapController"></div>
    </div>
    @include('annotations::index.sidebar')
</div>
@endsection
