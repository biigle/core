<div class="transect__images" data-ng-controller="ImagesController" data-ng-class="getClass()">
    <figure class="transect-figure ng-cloak" data-ng-repeat="id in getImageIds()" data-ng-class="getClass()" data-popover-placement="@{{getPopoverPlacement()}}" data-popover-trigger="none" data-popover-is-open="isPopoverOpen()" data-uib-popover-template="'imageLabelPopover.html'">
        <div class ="image-wrapper" title="@{{isInLabelMode() ? 'Attach the selected label' : ''}}" data-ng-click="handleClick($event)">
            <div class="transect-figure__flags" data-ng-show="hasFlag()">
                <span class="figure-flag" title="This annotation matches the filter rules"></span>
            </div>
            <img src="{{ asset(config('thumbnails.empty_url')) }}" data-ng-src="{{ url('api/v1/annotations/') }}/@{{ id }}/patch" data-fallback-src="{{ asset(config('thumbnails.empty_url')) }}">
        </div>
        <div class="image-buttons">
            <button class="btn image-button" title="Show annotation labels" data-ng-click="toggleLabelPopover()">
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
                    <button type="button" class="close pull-right" title="Detach the label @{{imageLabel.label.name}}" data-ng-click="detachLabel(imageLabel)" data-ng-if="canDetachLabel(imageLabel)"><span aria-hidden="true">&times;</span></button>
                    <div class="label-item">
                        <span class="label-color" data-ng-style="{'background-color': '#' + imageLabel.label.color}"></span>
                        <span class="label-name" data-ng-bind="imageLabel.label.name"></span><br>
                        <span class="label-user">
                            <small data-ng-bind="imageLabel.user.firstname"></small> <small data-ng-bind="imageLabel.user.lastname"></small>
                        </span>
                    </div>
                </li>
            </ul>
            <span data-ng-switch-default="">No annotation labels</span>
        </div>
        <span data-ng-switch-default="">loading...</span>
    </div>
</script>
