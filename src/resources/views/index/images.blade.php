<div class="transect__images" data-ng-controller="ImagesController" data-ng-class="getClass()">
    <figure class="transect-figure ng-cloak" data-ng-repeat="id in getImageIds()" data-ng-click="handleClick($event)" data-ng-class="getClass()">
        @if (Route::has('annotate'))
            <a class="transect-figure__link" href="{{ route('annotate', '') }}/@{{id}}" title="@{{isInLabelMode() ? 'Attach the selected label' : 'Annotate this image'}}">
        @else
            <div title="@{{isInLabelMode() ? 'Attach the selected label' : ''}}">
        @endif
                <div class="transect-figure__flags" data-ng-show="hasFlag()">
                    <span class="figure-flag" title="This image matches the filter rules"></span>
                </div>
                <img src="{{ asset(config('thumbnails.empty_url')) }}" data-ng-src="{{ url('api/v1/images/') }}/@{{ id }}/thumb" data-fallback-src="{{ asset(config('thumbnails.empty_url')) }}">
                {{--<img src="{{ asset(config('thumbnails.empty_url')) }}" data-ng-src="{{ url('thumbs/') }}/@{{ id }}.jpg" data-fallback-src="{{ asset(config('thumbnails.empty_url')) }}">--}}
                <a href="{{ route('image', '') }}/@{{id}}" class="info-link" title="View image information"><span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span></a>
        @if (Route::has('annotate'))
            </a>
        @else
            </div>
        @endif
    </figure>
</div>
