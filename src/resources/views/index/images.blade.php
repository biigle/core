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
