@extends('app')

@section('title'){{ $volume->name }} @stop

@push('scripts')
    <script src="{{ cachebust_asset('vendor/label-trees/scripts/main.js') }}"></script>
    <script src="{{ cachebust_asset('vendor/largo/scripts/vue.js') }}"></script>
    <script type="text/javascript">
        // angular.module('biigle.largo').constant('LARGO_VOLUME_ID', {{$volume->id}});
        // angular.module('biigle.largo').constant('THUMB_DIMENSION', {WIDTH: {{config('thumbnails.width')}}, HEIGHT: {{config('thumbnails.height')}} });
        // angular.module('biigle.largo').constant('LABEL_TREES', {!!$labelTrees!!});
        biigle.$declare('largo.volumeId', {!! $volume->id !!});
        biigle.$declare('largo.labelTrees', {!! $labelTrees !!});
    </script>
@endpush

@push('styles')
    <link href="{{ cachebust_asset('vendor/label-trees/styles/main.css') }}" rel="stylesheet">
    <link href="{{ cachebust_asset('vendor/largo/styles/main.css') }}" rel="stylesheet">
@endpush

@section('navbar')
<div class="navbar-text navbar-largo-breadcrumbs">
    @include('volumes::partials.projectsBreadcrumb') / <a href="{{route('volume', $volume->id)}}" title="Show volume {{$volume->name}}" class="navbar-link">{{$volume->name}}</a> / <strong id="dismiss-mode-title">Largo - dismiss existing annotations</strong><strong id="re-labelling-mode-title" class="ng-hide">Largo - re-label dismissed annotations</strong> <small>(<span id="largo-annotation-count">0</span>&nbsp;annotations)</small> @include('volumes::partials.annotationSessionIndicator')
</div>
@endsection

@section('content')
<div id="largo-container" class="largo-container">
    <div class="largo-images">
        <div v-cloak v-if="loading" class="largo-container__loader">
            <div class="alert alert-info">
                <loader :active="true"></loader>
            </div>
        </div>
        <div v-if="!selectedLabel" class="alert alert-info">
            Please choose a label in the sidebar.
        </div>
        <image-grid :images="annotations" empty-url="{{ asset(config('thumbnails.empty_url')) }}" :width="{{config('thumbnails.width')}}" :height="{{config('thumbnails.height')}}" v-else></image-grid>
    </div>
    <sidebar :show-buttons="false" open-tab="labels">
        <sidebar-tab v-cloak class="largo-tab" slot="tabs" name="labels" icon="tags" title="Label trees">
            <div class="largo-tab__button">
                <button class="btn btn-success btn-block" :disabled="true">Continue</button>
            </div>
            <label-trees class="largo-tab__label-trees" :trees="labelTrees" :show-favourites="true" v-on:select="handleSelectedLabel" v-on:deselect="handleDeselectedLabel" v-on:clear="handleDeselectedLabel"></label-trees>
        </sidebar-tab>
    </sidebar>
</div>
@endsection
