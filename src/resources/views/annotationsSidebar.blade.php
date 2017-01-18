@if ($editMode)
    <div class="largo-example-patches" data-ng-controller="LargoExamplePatchesController">
        <div class="patch-container ng-cloak" data-ng-switch="isLoading()" data-ng-if="isEnabled() && hasLabel()">
            <div class="alert alert-info" data-ng-switch-when="true">
                Loading example annotations...
            </div>
            <div data-ng-switch-default="" data-ng-switch="hasPatches()">
                <img class="patch" src="{{ asset(config('thumbnails.empty_url')) }}" data-ng-src="{{ url('api/v1/annotations/') }}/@{{ patch }}/patch" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'" data-ng-switch-when="true" data-ng-repeat="patch in getPatches()" title="Example annotation for label @{{getLabelName()}}">
                <div class="alert alert-info" data-ng-switch-default="">
                    No example annotations available.
                </div>
            </div>
        </div>
    </div>
@endif
