@extends('app')
@section('full-navbar', true)
@section('title', $video->name)

@section('navbar')
<div class="navbar-text navbar-annotations-breadcrumbs">
    <a href="{{route('project', $video->project_id)}}" class="navbar-link" title="Show project {{$video->project->name}}">{{$video->project->name}}</a> /
    <strong>{{$video->name}}</strong>
</div>
@endsection

@section('content')
<div id="video-container" class="video-container sidebar-container">
    <div class="sidebar-container__content">
        <video-screen
            :annotations="annotations"
            :video=video
            v-on:create-bookmark="createBookmark"
            v-on:create-annotation="createAnnotation"
            ></video-screen>
        <video-timeline
            :annotations="annotations"
            :video=video
            :bookmarks="bookmarks"
            v-on:seek="seek"
            v-on:select="selectAnnotation"
            v-on:deselect="deselectAnnotations"
            ></video-timeline>
    </div>
    @can('edit-in', $video)
        <sidebar :toggle-on-keyboard="true" open-tab="labels" v-cloak>
            <sidebar-tab name="labels" icon="tags" title="Label trees">
                <div class="labels-tab">
                    <div class="labels-tab__trees">
                        <label-trees :trees="labelTrees" :show-favourites="true" v-on:select="handleSelectedLabel" v-on:deselect="handleDeselectedLabel" v-on:clear="handleDeselectedLabel"></label-trees>
                    </div>
                </div>
            </sidebar-tab>
        </sidebar>
    @endcan
</div>
@endsection

@push('scripts')
@if (app()->environment('local'))
    <script src="{{ cachebust_asset('vendor/annotations/scripts/ol-debug.js') }}"></script>
@else
    <script src="{{ cachebust_asset('vendor/annotations/scripts/ol.js') }}"></script>
@endif
<script src="{{ cachebust_asset('vendor/annotations/scripts/main.js') }}"></script>
<script src="{{ cachebust_asset('vendor/label-trees/scripts/main.js') }}"></script>
<script src="{{ cachebust_asset('vendor/videos/scripts/main.js') }}"></script>
<script type="text/javascript">
    biigle.$declare('videos.id', '{{$video->id}}');
    biigle.$declare('videos.src', '{{url('api/v1/videos/'.$video->id.'/file')}}');
    @can('editIn', $video)
        biigle.$declare('videos.labelTrees', {!! $labelTrees !!});
    @endcan
    biigle.$declare('videos.shapes', {!! $shapes !!});
    biigle.$declare('videos.isEditor', @can('editIn', $video) true @else false @endcan);
</script>
@endpush

@push('styles')
<link href="{{ cachebust_asset('vendor/annotations/styles/ol.css') }}" rel="stylesheet">
<link href="{{ cachebust_asset('vendor/annotations/styles/main.css') }}" rel="stylesheet">
<link href="{{ cachebust_asset('vendor/label-trees/styles/main.css') }}" rel="stylesheet">
<link href="{{ cachebust_asset('vendor/videos/styles/main.css') }}" rel="stylesheet">
@endpush
