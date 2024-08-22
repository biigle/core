@extends('app')
@section('full-navbar', true)
@section('title', $tree->name)

@push('scripts')
<script src="{{ cachebust_asset('vendor/largo/scripts/main.js') }}"></script>
<script type="text/javascript">
    biigle.$declare('annotationCatalog.labelTree', {!! $tree !!});
    biigle.$declare('annotationCatalog.showImageAnnotationRoute', '{{ route('show-image-annotation', '') }}/');
    biigle.$declare('annotationCatalog.showVideoAnnotationRoute', '{{ route('show-video-annotation', '') }}/');
    biigle.$declare('largo.patchUrlTemplate', '{{$patchUrlTemplate}}');
</script>
@endpush


@push('styles')
<link href="{{ cachebust_asset('vendor/largo/styles/main.css') }}" rel="stylesheet">
@endpush

@section('navbar')
<div class="navbar-text navbar-largo-breadcrumbs">
    <a href="{{route('label-trees', $tree->id)}}" title="Show label tree {{$tree->name}}" class="navbar-link">{{$tree->name}}</a> / <strong>Annotation catalog</strong> <span id="largo-title"><small>(<span v-text="shownCount">0</span>&nbsp;annotations)</small></span>
</div>
@endsection


@section('content')
<div id="annotation-catalog-container" class="sidebar-container">
    <div class="sidebar-container__content">
        <catalog-image-grid :images="annotations" ref="dismissGrid" empty-url="{{ asset(config('thumbnails.empty_url')) }}" :width="{{config('thumbnails.width')}}" :height="{{config('thumbnails.height')}}"></catalog-image-grid>
        <div class="largo-images__alerts" :class="{block: loading}">
            <div v-cloak v-if="loading">
                <loader :active="true" :fancy="true"></loader>
            </div>
            <div v-if="!selectedLabel" class="text-info">
                Please choose a label in the sidebar.
            </div>
            <div v-cloak v-if="hasNoAnnotations" class="text-info">
                There are no annotations with the label <strong v-text="selectedLabel.name"></strong> for you.
            </div>
        </div>
    </div>
    <sidebar :show-buttons="false" open-tab="labels">
        <sidebar-tab class="largo-tab" name="labels" icon="tags" title="Label tree">
            <power-toggle v-cloak class="largo-tab__button" :active="showAnnotationOutlines" title-off="Show annotation outlines" title-on="Hide annotation outlines" v-on:on="showOutlines" v-on:off="hideOutlines">Show annotation outlines</power-toggle>
            <label-trees class="largo-tab__label-trees" :trees="labelTrees" :collapsible="false" v-on:select="handleSelectedLabel" v-on:deselect="handleDeselectedLabel" v-on:clear="handleDeselectedLabel"></label-trees>
        </sidebar-tab>
        
    </sidebar>
</div>

@endsection
