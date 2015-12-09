@extends('app')
@inject('modules', 'Dias\Services\Modules')

@section('title'){{ $transect->name }} @stop

@section('scripts')
    <script src="{{ asset('vendor/transects/scripts/main.js') }}"></script>
    <script type="text/javascript">
        angular.module('dias.transects').constant('TRANSECT_IMAGES', {{json_encode($transect->images->sortBy('id')->lists('id'))}});
        angular.module('dias.transects').constant('TRANSECT_ID', {{$transect->id}});
    </script>
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
<div class="transect-container" data-ng-app="dias.transects" data-ng-controller="TransectController">
    <div class="transect__progress">
        <div class="transect__progress-bar" data-ng-style="progress()"></div>
    </div>
    <div class="transect-menubar">
        <button class="btn btn-default transect-menubar__item" data-popover-placement="right" data-uib-popover-template="'infoPopover.html'" type="button" title="Show transect information">
            <span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span>
        </button>
        <button class="btn btn-default transect-menubar__item" data-popover-placement="right" data-uib-popover-template="'settingsPopover.html'" type="button" title="Show settings">
            <span class="glyphicon glyphicon-cog" aria-hidden="true"></span>
        </button>
        @if (!empty($modules->getMixins('transectsFilters')))
            <button class="btn btn-default transect-menubar__item" data-popover-placement="right" data-uib-popover-template="'filterPopover.html'" type="button" title="Filter images" data-ng-class="{'btn-info':flags.hasActiveFilters()}">
                <span class="glyphicon glyphicon-filter" aria-hidden="true"></span>
            </button>
        @endif
        @foreach ($modules->getMixins('transectsMenubar') as $module => $nestedMixins)
            @include($module.'::transectsMenubar')
        @endforeach
    </div>
    <div class="transect__images" data-ng-controller="ImagesController">
        <figure class="transect-figure" data-ng-repeat="id in images.sequence | limitTo: images.limit">
            <div class="transect-figure__flags ng-cloak" data-ng-if="settings.get('show-flags')">
                <span class="figure-flag" data-ng-repeat="flag in flags.cache[id] track by $index" title="@{{flag.title}}" data-ng-class="flag.cssClass"></span>
            </div>
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

    <script type="text/ng-template" id="settingsPopover.html">
        <div class="transect-settings-popover">
            <div>
                <span class="settings-label">
                    Flags&nbsp;<span class="glyphicon glyphicon-question-sign help-icon" aria-hidden="true" title="Flags mark images with special properties, e.g. those having annotations."></span>
                </span>
                <span class="settings-control">
                    <div class="btn-group">
                        <button type="button" class="btn btn-default" data-ng-class="{active: settings.get('show-flags')}" data-ng-click="settings.set('show-flags', true)">Show</button>
                        <button type="button" class="btn btn-default" data-ng-class="{active: !settings.get('show-flags')}" data-ng-click="settings.set('show-flags', false)">Hide</button>
                    </div>
                </span>
            </div>
        </div>
    </script>

    <script type="text/ng-template" id="filterPopover.html">
        <div class="transect-filter-popover" data-ng-controller="FilterController">
            <strong>Filter</strong> <small><span data-ng-bind="currentNoImages">2</span> of <span data-ng-bind="totalNoImages">4</span> images</small>
            <ul class="list-group filter-list">
                @foreach ($modules->getMixins('transectsFilters') as $module => $nestedMixins)
                    @include($module.'::transectsFilters')
                @endforeach
            </ul>
        </div>
    </script>
</div>
@endsection
