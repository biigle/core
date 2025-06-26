@extends('app')
@section('title', "Edit volume {$volume->name}")

@push('scripts')
    <script type="module">
        biigle.$declare('volumes.id', {!! $volume->id !!});
        biigle.$declare('volumes.annotationSessions', {{Js::from($annotationSessions)}});
        biigle.$declare('volumes.type', '{!! $type !!}');
        biigle.$declare('volumes.hasMetadata', {!! $volume->hasMetadata() ? 'true' : 'false' !!});
        biigle.$declare('volumes.hasMetadataAnnotations', {!! ($volume->hasMetadata() && $volume->getMetadata()->hasAnnotations()) ? 'true' : 'false' !!});
        biigle.$declare('volumes.hasMetadataFileLabels', {!! ($volume->hasMetadata() && $volume->getMetadata()->hasFileLabels()) ? 'true' : 'false' !!});
        biigle.$declare('volumes.parsers', {!! $parsers !!});
    </script>
    @mixin('volumesEditScripts')
@endpush

@push('styles')
    @mixin('volumesEditStyles')
@endpush

@section('navbar')
<div class="navbar-text navbar-volumes-breadcrumbs">
    @include('volumes.partials.projectsBreadcrumb') / <strong>{{$volume->name}}</strong>
</div>
@endsection

@section('content')

<div class="container">
    <h2 class="col-xs-12 clearfix">
        Edit {{$volume->name}}
        <span class="pull-right">
            <a class="btn btn-default" href="{{route('volume', $volume->id)}}">Back</a>
        </span>
    </h2>
    <div class="col-sm-6">
        @include('volumes.edit.information')
        @include('volumes.edit.annotation-sessions')
        @mixin('volumesEditLeft')
    </div>
    <div class="col-sm-6">
        @include('volumes.edit.files')
        @include('volumes.edit.metadata')
        @mixin('volumesEditRight')
    </div>
</div>

@endsection
