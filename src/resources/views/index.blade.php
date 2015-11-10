@extends('app')
@inject('modules', 'Dias\Services\Modules')

@section('title'){{ $transect->name }} @stop

@section('scripts')
    <script src="{{ asset('vendor/transects/scripts/main.js') }}"></script>
    @foreach ($modules->getMixins('transectsScripts') as $module => $nestedMixins)
        @include($module.'::transectsScripts', ['mixins' => $nestedMixins])
    @endforeach
@append

@section('styles')
    <link href="{{ asset('vendor/transects/styles/main.css') }}" rel="stylesheet">
    @foreach ($modules->getMixins('transectsStyles') as $module => $nestedMixins)
        @include($module.'::transectsStyles', ['mixins' => $nestedMixins])
    @endforeach
@append

@section('content')
<div class="transect-container" data-ng-app="dias.transects" data-ng-controller="TransectController" data-transect-id="{{ $transect->id }}">
    <div class="transect__progress">
        <div class="transect__progress-bar" data-ng-style="progress()"></div>
    </div>
    <div class="transect-menubar">
        <button class="btn btn-regular transect-menubar__item" data-popover-placement="right" data-uib-popover-template="'infoPopover.html'" type="button" title="Show transect information">
            <span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span>
        </button>
        @foreach ($modules->getMixins('transectsMenubar') as $module => $nestedMixins)
            @include($module.'::transectsMenubar')
        @endforeach
    </div>
    <div class="transect__images" data-ng-controller="ImagesController">
        <figure class="transect-figure" data-ng-repeat="id in images | limitTo: info.limit">
            <img src="{{ asset(config('thumbnails.empty_url')) }}" data-lazy-image="{{ url('api/v1/images/') }}/@{{ id }}/thumb">
            @foreach ($modules->getMixins('transects') as $module => $nestedMixins)
                @include($module.'::transects', ['mixins' => $nestedMixins])
            @endforeach
            <a href="{{ route('image', '') }}/@{{id}}" class="info-link" title="View image information"><span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span></a>
        </figure>
    </div>

    <script type="text/ng-template" id="infoPopover.html">
        <div>
            <p>
                <strong>{{ $transect->name }}</strong>
                <small>({{ $transect->images->count() }}&nbsp;images)</small>
            </p>
            <ul class="transect-info-popover__projects">
                @foreach($transect->projects as $project)
                    <li>{{ $project->name }}</li>
                @endforeach
            </ul>
        </div>
    </script>
</div>
@endsection
