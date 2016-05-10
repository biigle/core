<div class="transect__images" data-ng-controller="ImagesController">
    <figure class="transect-figure ng-cloak" data-ng-repeat="id in images.sequence | limitTo: images.limit">
        <div class="transect-figure__flags" data-ng-show="imageHasFlag(id)">
            <span class="figure-flag" title="This image matches the filter rules"></span>
        </div>
        <img src="{{ asset(config('thumbnails.empty_url')) }}" data-lazy-image="{{ url('api/v1/images/') }}/@{{ id }}/thumb">
        @foreach ($modules->getMixins('transects') as $module => $nestedMixins)
            @include($module.'::transects', ['mixins' => $nestedMixins])
        @endforeach
        <a href="{{ route('image', '') }}/@{{id}}" class="info-link" title="View image information"><span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span></a>
    </figure>
</div>
