<div class="transect__images" data-ng-controller="ImagesController" data-ng-class="getClass()">
    <figure class="transect-figure ng-cloak" data-ng-if="hasSelectedLabel()" data-ate-figure="" data-ng-repeat="id in getImageIds()" data-ng-class="getClass()">
        <div class ="image-wrapper" title="@{{isInDismissMode() ? (isDismissed() ? 'Undo dismissing this annotation label' : 'Dismiss this annotation label') : 'Attach the selected label'}}" data-ng-click="handleClick($event)">
            <img src="{{ asset(config('thumbnails.empty_url')) }}" data-ng-src="{{ url('api/v1/annotations/') }}/@{{ id }}/patch" data-fallback-src="{{ asset(config('thumbnails.empty_url')) }}">
        </div>
        <div class="image-buttons">
        </div>
    </figure>
    <div class="select-label-alert" data-ng-if="!hasSelectedLabel()">
        <div class="alert alert-info">
            Please choose a label in the sidebar to start the re-evaluation.
        </div>
    </div>
</div>
