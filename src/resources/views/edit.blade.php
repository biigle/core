@extends('app')
@inject('modules', 'Dias\Services\Modules')

@section('title')Edit transect {{ $transect->name }} @stop

@push('scripts')
    <script src="{{ cachebust_asset('vendor/transects/scripts/edit.js') }}"></script>
    <script type="text/javascript">
        angular.module('dias.transects.edit').constant('TRANSECT_ID', {!!$transect->id!!});
        angular.module('dias.transects.edit').constant('ANNOTATION_SESSIONS', {!!$annotationSessions!!});
    </script>
    @foreach ($modules->getMixins('transectsEditScripts') as $module => $nestedMixins)
        @include($module.'::transectsEditScripts', ['mixins' => $nestedMixins])
    @endforeach
@endpush

@push('styles')
    <link href="{{ cachebust_asset('vendor/transects/styles/edit.css') }}" rel="stylesheet">
    @foreach ($modules->getMixins('transectsEditStyles') as $module => $nestedMixins)
        @include($module.'::transectsEditStyles', ['mixins' => $nestedMixins])
    @endforeach
@endpush

@section('content')

<div class="container" data-ng-app="dias.transects.edit">
    <h2 class="col-xs-12 clearfix">
        Edit {{$transect->name}}
        <span class="pull-right">
            <a class="btn btn-default" href="{{route('transect', $transect->id)}}">Back</a>
        </span>
    </h2>
    <div class="col-sm-6">
        @include('transects::edit.information')
        @include('transects::edit.annotation-sessions')
    </div>
    <div class="col-sm-6">
    @include('transects::edit.images')
    </div>
</div>

@endsection
