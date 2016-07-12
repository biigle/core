<div class="transect__images label-mode" data-ng-controller="ImagesController">
    <figure class="transect-figure ng-cloak" data-ate-figure="" data-ng-repeat="id in getImageIds()" data-ng-class="getClass()">
        <div class ="image-wrapper" title="@{{getTitle()}}" data-ng-click="handleClick($event)">
            <img src="{{ asset(config('thumbnails.empty_url')) }}" data-ng-src="{{ url('api/v1/annotations/') }}/@{{ id }}/patch" data-fallback-src="{{ asset(config('thumbnails.empty_url')) }}">
        </div>
        <div class="changed-label ng-cloak" data-ng-if="isInReLabellingMode() && isChanged()">
            <span class="changed-label-color" data-ng-style="{'background-color': '#' + changedLabel.color}"></span>
            <span class="changed-label-name" data-ng-bind="changedLabel.name"></span>
        </div>
        <div class="image-buttons">
        </div>
    </figure>

    <div class="ate-alert" data-ng-switch="hasSelectedLabel()" data-ng-if="isInDismissMode()">
        <div class="alert alert-info" data-ng-switch-when="false">
            Please choose a label in the sidebar to start the re-evaluation.
        </div>
        <div data-ng-switch-default="" data-ng-switch="isLoading()">
            <div class="alert alert-info ng-cloak" data-ng-switch-when="true">
                loading...
            </div>
            <div class="alert alert-info ng-cloak" data-ng-switch-default="" data-ng-if="!annotationsExist()">
                There are no annotations with the label <strong data-ng-bind="getSelectedLabelName()"></strong>.
            </div>
        </div>
    </div>
    <div class="ate-alert ng-cloak" data-ng-if="isInReLabellingMode()">
        <div class="alert alert-info" data-ng-if="!annotationsExist()">
            There are no annotations marked for dismissal.
        </div>
    </div>
    <div class="ate-alert ng-cloak" data-ng-if="isSaving()">
        <div class="alert alert-info">
            saving...
        </div>
    </div>
</div>
