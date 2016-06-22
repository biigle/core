<div class="transect__images label-mode" data-ng-controller="ImagesController">
    <figure class="transect-figure ng-cloak" data-ate-figure="" data-ng-repeat="id in getImageIds()" data-ng-class="getClass()">
        <div class ="image-wrapper" title="@{{isInDismissMode() ? (isDismissed() ? 'Undo dismissing this annotation' : 'Dismiss this annotation') : 'Attach the selected label'}}" data-ng-click="handleClick($event)">
            <img src="{{ asset(config('thumbnails.empty_url')) }}" data-ng-src="{{ url('api/v1/annotations/') }}/@{{ id }}/patch" data-fallback-src="{{ asset(config('thumbnails.empty_url')) }}">
        </div>
        <div class="image-buttons">
        </div>
    </figure>

    <div class="ate-alert" data-ng-switch="hasSelectedLabel()">
        <div class="alert alert-info" data-ng-switch-when="false">
            Please choose a label in the sidebar to start the re-evaluation.
        </div>
        <div class="alert alert-info" data-ng-switch-default="" data-ng-if="!annotationsExist()">
            There are no annotations with the label <strong data-ng-bind="getSelectedLabelName()"></strong>.
        </div>
    </div>
</div>
