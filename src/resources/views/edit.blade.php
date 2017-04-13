@extends('app')
@inject('modules', 'Biigle\Services\Modules')

@section('title')Edit volume {{ $volume->name }} @stop

@push('scripts')
    <script src="{{ cachebust_asset('vendor/volumes/scripts/edit.js') }}"></script>
    <script src="{{ cachebust_asset('vendor/volumes/scripts/main.js') }}"></script>
    <script type="text/javascript">
        angular.module('biigle.volumes.edit').constant('VOLUME_ID', {!!$volume->id!!});
        angular.module('biigle.volumes.edit').constant('ANNOTATION_SESSIONS', {!!$annotationSessions!!});

        biigle.$declare('volumes.id', {!! $volume->id !!});
        biigle.$declare('volumes.annotationSessions', {!! $annotationSessions !!});
    </script>
    @foreach ($modules->getMixins('volumesEditScripts') as $module => $nestedMixins)
        @include($module.'::volumesEditScripts', ['mixins' => $nestedMixins])
    @endforeach
@endpush

@push('styles')
    <link href="{{ cachebust_asset('vendor/volumes/styles/edit.css') }}" rel="stylesheet">
    @foreach ($modules->getMixins('volumesEditStyles') as $module => $nestedMixins)
        @include($module.'::volumesEditStyles', ['mixins' => $nestedMixins])
    @endforeach
@endpush

@section('content')

<div class="container" data-ng-app="biigle.volumes.edit">
    <h2 class="col-xs-12 clearfix">
        Edit {{$volume->name}}
        <span class="pull-right">
            <a class="btn btn-default" href="{{route('volume', $volume->id)}}">Back</a>
        </span>
    </h2>
    <div class="col-sm-6">
        @include('volumes::edit.information')
        @include('volumes::edit.metadata')
        @include('volumes::edit.annotation-sessions')
    </div>
    <div class="col-sm-6">
        @include('volumes::edit.images')
        @include('volumes::edit.annotation-sessions-angular')
    </div>
</div>

@endsection
