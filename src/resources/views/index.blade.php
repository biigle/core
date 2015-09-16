@extends('app')
@inject('modules', 'Dias\Services\Modules')

@section('title'){{ $transect->name }} #{{ $transect->id }} ({{ $transect->images->count() }} images) @stop

@section('scripts')
<script src="{{ asset('vendor/transects/scripts/main.js') }}"></script>
@foreach ($modules->getMixins('transectsScripts') as $module => $nestedMixins)
    @include($module.'::transectsScripts', array('mixins' => $nestedMixins))
@endforeach
@append

@section('styles')
<link href="{{ asset('vendor/transects/styles/main.css') }}" rel="stylesheet">
@foreach ($modules->getMixins('transectsStyles') as $module => $nestedMixins)
    @include($module.'::transectsStyles', array('mixins' => $nestedMixins))
@endforeach
@append

@section('content')
<div class="transect-container" data-ng-app="dias.transects">
	<div class="transect__images" data-ng-controller="ImagesController" data-transect-id="{{ $transect->id }}">
        <figure class="transect-figure" data-ng-repeat="id in images | limitTo: limit">
            <img src="{{ asset('vendor/transects/images/blank.png') }}" data-lazy-image="{{ url('api/v1/images/') }}/@{{ id }}/thumb">
            @foreach ($modules->getMixins('transects') as $module => $nestedMixins)
                @include($module.'::transects', array('mixins' => $nestedMixins))
            @endforeach
            <a href="{{ route('image', '') }}/@{{id}}" class="info-link" title="View image information"><span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span></a>
        </figure>
    </div>
</div>
@endsection
