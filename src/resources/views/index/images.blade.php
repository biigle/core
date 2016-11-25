<div class="transect__images" data-ng-controller="ImagesController" data-ng-class="getClass()">
    <figure class="transect-figure ng-cloak" data-transect-figure="" data-ng-repeat="id in getImageIds()" data-ng-class="getClass()" data-popover-placement="@{{getPopoverPlacement()}}" data-popover-trigger="none" data-popover-is-open="isPopoverOpen()" data-uib-popover-template="'imageLabelPopover.html'">
        @if (Route::has('annotate'))
            <a class="transect-figure__link" href="{{ route('annotate', '') }}/@{{id}}" title="@{{isInLabelMode() ? 'Attach the selected label' : 'Annotate this image'}}" data-ng-click="handleClick($event)">
        @else
            <div title="@{{isInLabelMode() ? 'Attach the selected label' : ''}}" data-ng-click="handleClick($event)">
        @endif
            <div class="transect-figure__flags" data-ng-show="hasFlag()">
                <span class="figure-flag" title="This image matches the filter rules"></span>
            </div>
            <img src="{{ asset(config('thumbnails.empty_url')) }}" data-ng-src="{{  asset(config('thumbnails.uri')) }}/@{{uuid}}.{{ config('thumbnails.format') }}"  onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
        @if (Route::has('annotate'))
            </a>
        @else
            </div>
        @endif
        <div class="image-buttons">
            <a href="{{ route('image', '') }}/@{{id}}" class="image-button" title="View image information">
                <span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span>
            </a>
            <button class="btn image-button" title="Show image labels" data-ng-click="toggleLabelPopover()">
                <span class="glyphicon glyphicon-tag" aria-hidden="true"></span>
            </button>
        </div>
    </figure>
</div>

<script type="text/ng-template" id="imageLabelPopover.html">
    <div data-ng-switch="imageLabelsResolved()" class="image-label-popover" data-ng-mouseenter="disableScrolling()" data-ng-mouseleave="enableScrolling()">
        <div data-ng-switch-when="true" data-ng-switch="hasImageLabels()">
            <ul class="image-label-list list-unstyled" data-ng-switch-when="true">
                <li class="clearfix" data-ng-repeat="imageLabel in getImageLabels()">
                    @can('edit-in', $transect)
                        <button type="button" class="close pull-right" title="Detach the label @{{imageLabel.label.name}}" data-ng-click="detachLabel(imageLabel)" data-ng-if="canDetachLabel(imageLabel)"><span aria-hidden="true">&times;</span></button>
                    @endcan
                    <div class="label-item">
                        <span class="label-color" data-ng-style="{'background-color': '#' + imageLabel.label.color}"></span>
                        <span class="label-name" data-ng-bind="imageLabel.label.name"></span><br>
                        <span class="label-user">
                            <small data-ng-bind="imageLabel.user.firstname"></small> <small data-ng-bind="imageLabel.user.lastname"></small>
                        </span>
                    </div>
                </li>
            </ul>
            <span data-ng-switch-default="">No image labels</span>
        </div>
        <span class="loader loader--active" data-ng-switch-default=""></span>
    </div>
</script>
