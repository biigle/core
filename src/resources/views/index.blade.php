@extends('app')
@inject('modules', 'Dias\Services\Modules')

@section('title'){{ $transect->name }} @stop

@push('scripts')
    <script src="{{ asset('vendor/transects/scripts/main.js') }}"></script>
    <script type="text/javascript">
        angular.module('dias.transects').constant('TRANSECT_IMAGES', {{$transect->images->sortBy('id')->pluck('id')}});
        angular.module('dias.transects').constant('TRANSECT_ID', {{$transect->id}});
    </script>
    @foreach ($modules->getMixins('transectsScripts') as $module => $nestedMixins)
        @include($module.'::transectsScripts', ['mixins' => $nestedMixins])
    @endforeach
@endpush

@push('styles')
    <link href="{{ asset('vendor/transects/styles/main.css') }}" rel="stylesheet">
    @foreach ($modules->getMixins('transectsStyles') as $module => $nestedMixins)
        @include($module.'::transectsStyles', ['mixins' => $nestedMixins])
    @endforeach
@endpush

@section('content')
<div class="transect-container" data-ng-app="dias.transects" data-ng-controller="TransectController">
    <div class="transect__progress">
        <div class="transect__progress-bar" data-ng-style="progress()"></div>
    </div>
    @include('transects::index.menubar')
    @include('transects::index.images')
</div>
@endsection
