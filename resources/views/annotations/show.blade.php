@extends('app')
@section('full-navbar', true)

@section('title', "Annotate {$image->filename}")

@push('scripts')
<script type="text/javascript">
    @can('add-annotation', $image)
        biigle.$declare('annotations.labelTrees', {!! $labelTrees !!});
    @endcan
    biigle.$declare('annotations.imageId', {!! $image->id !!});
    biigle.$declare('annotations.volumeId', {!! $image->volume_id !!});
    biigle.$declare('annotations.shapes', {!! $shapes !!});
    biigle.$declare('annotations.imagesIds', {!! $images->keys() !!});
    biigle.$declare('annotations.imagesFilenames', {!! $images->values() !!});
    biigle.$declare('annotations.imageFileUri', '{!! url('api/v1/images/:id/file') !!}');
    biigle.$declare('annotations.tilesUri', '{{ $tilesUriTemplate }}');
    biigle.$declare('annotations.sessions', {!!$annotationSessions!!});
    biigle.$declare('annotations.isEditor', @can('add-annotation', $image) true @else false @endcan);
    biigle.$declare('annotations.userId', {!! $user->id !!});
    biigle.$declare('annotations.isAdmin', @can('update', $volume) true @else false @endcan);

</script>
@mixin('annotationsScripts')
@endpush

@push('styles')
@mixin('annotationsStyles')
@endpush

@section('navbar')
<div class="navbar-text">
    <div class="annotations-project-dd">
        @include('volumes.partials.projectsBreadcrumb', ['projects' => $volume->projects]) /
    </div>
    <div class="annotations-breadcrumb">
        <a href="{{route('volume', $volume->id)}}" class="navbar-link" title="Show volume {{$volume->name}}">{{$volume->name}}</a> /
        <span id="annotations-navbar">
            <breadcrumb
                :file-ids="ids"
                :filenames="filenames"
                :show-indicator="showIndicator"
                :current-file-id="currentId"
                type="image"
                >
                <strong>{{$image->filename}}</strong>
            </breadcrumb>
        </span>
    </div>
    @include('volumes.partials.annotationSessionIndicator')
</div>
@endsection

@section('content')
<div id="annotator-container" class="sidebar-container" v-cloak>
    <div class="sidebar-container__content">
        <loader-block :active="loading"></loader-block>
        <message-curtain v-if="hasCrossOriginError" v-cloak>
            <div class="message-curtain--text text-danger">
                <div class="lead">
                    Please configure <a href="/manual/tutorials/volumes/remote-volumes#cors">cross origin resource sharing</a> on your remote image location.<br>The image orientation may be wrong if you continue.
                </div>
                <button type="button" class="btn btn-default" v-on:click="dismissCrossOriginError">Continue at own risk</button>
            </div>
        </message-curtain>
        <annotation-canvas
            :can-add="canAdd"
            :can-modify="canModify"
            :can-delete="canDelete"
            :image="image"
            :annotations="filteredAnnotations"
            :selected-annotations="selectedAnnotations"
            :last-created-annotation="lastCreatedAnnotation"
            :center="mapCenter"
            :resolution="mapResolution"
            :selected-label="selectedLabel"
            :annotation-opacity="annotationOpacity"
            :annotation-mode="annotationMode"
            :show-mouse-position="showMousePosition"
            :show-zoom-level="showZoomLevel"
            :show-scale-line="showScaleLine"
            :images-area="imagesArea"
            :show-label-tooltip="showLabelTooltip"
            :show-measure-tooltip="showMeasureTooltip"
            :show-minimap="showMinimap"
            :user-id="userId"
            v-on:moveend="handleMapMoveend"
            v-on:previous="handlePrevious"
            v-on:next="handleNext"
            v-on:new="handleNewAnnotation"
            v-on:select="handleSelectAnnotations"
            v-on:update="handleUpdateAnnotations"
            v-on:attach="handleAttachLabel"
            v-on:swap="handleSwapLabel"
            v-on:delete="handleDeleteAnnotations"
            v-on:measuring="fetchImagesArea"
            v-on:requires-selected-label="handleRequiresSelectedLabel"
            v-on:is-invalid-shape="handleInvalidShape"
            ref="canvas"
            inline-template>
            @include('annotations.show.annotationCanvas')
        </annotation-canvas>
    </div>
    <sidebar
        ref="sidebar"
        :open-tab="openTab"
        :toggle-on-keyboard="true"
        v-on:open="handleOpenedTab"
        v-on:close="handleClosedTab"
        v-cloak>
        @include('annotations.show.tabs.annotations')
        @can('add-annotation', $image)
            @include('annotations.show.tabs.labels')
        @endcan
        @include('annotations.show.tabs.annotationModes')
        @include('annotations.show.tabs.imageLabels')
        @include('annotations.show.tabs.colorAdjustment')
        @include('annotations.show.tabs.settings')
    </sidebar>
</div>
@endsection
