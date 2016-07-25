<div class="ate-example-patches ng-cloak" data-ng-controller="AteExamplePatchesController" data-ng-show="isEnabled()" data-ng-class="{filled: hasLabel()}">
    <div data-ng-switch="isLoading()">
        <div class="alert alert-info" data-ng-switch-when="true">
            Loading example annotations...
        </div>
        <div class="alert alert-info" data-ng-switch-default="" data-ng-if="hasLabel() && !hasPatches()">
            No example annotations available.
        </div>
    </div>
    <img class="patch" src="{{ asset(config('thumbnails.empty_url')) }}" data-ng-src="{{ url('api/v1/annotations/') }}/@{{ patch }}/patch" data-ng-if="hasPatches()" data-ng-repeat="patch in getPatches()" title="Example annotation for label @{{getLabelName()}}">
</div>
