<div class="transect-filter-menu-group">
    <button class="btn btn-default transect-menubar__item" data-popover-placement="right" data-uib-popover-template="'filterPopover.html'" type="button" title="Filter images" data-ng-class="{'btn-info':active()}" data-ng-controller="FilterController">
        <span class="glyphicon glyphicon-filter" aria-hidden="true"></span>
    </button>
</div>

<script data-ng-controller="HasImageLabelFilterController" type="text/ng-template" id="hasImageLabelsFilterRule.html">
@{{rule.filter.name}}
</script>

<script data-ng-controller="ImageLabelUserFilterController" type="text/ng-template" id="imageLabelByUserFilterRule.html">
@{{rule.filter.name}} <strong>@{{rule.data.firstname}} @{{rule.data.lastname}}</strong>
</script>

<script type="text/ng-template" id="imageLabelUserFilterTypeahead.html">
    <input class="form-control" placeholder="Select user" data-transect-filter-user-chooser="selectData" />
</script>

<script data-ng-controller="ImageLabelFilterController" type="text/ng-template" id="imageWithLabelFilterRule.html">
@{{rule.filter.name}} <strong>@{{rule.data.name}}</strong>
</script>

<script type="text/ng-template" id="imageLabelFilterTypeahead.html">
    <input class="form-control" placeholder="Select label" data-transect-image-label-chooser="selectData" data-transect-id="{{$transect->id}}" />
</script>

@foreach ($modules->getMixins('transectsFilters') as $module => $nestedMixins)
    @include($module.'::transectsFilters')
@endforeach

<script type="text/ng-template" id="filterPopover.html">
    <div class="transect-filter-popover">
        <div>
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-default" title="Show only images matching the filter rules" data-ng-class="{active: isFilterMode('filter')}" data-ng-click="setFilterMode('filter')"><span class="glyphicon glyphicon-filter" aria-hidden="true"></span></button>
                <button type="button" class="btn btn-default" title="Show all images but flag those matching the filter rules" data-ng-class="{active: isFilterMode('flag')}" data-ng-click="setFilterMode('flag')"><span class="glyphicon glyphicon-flag" aria-hidden="true"></span></button>
            </div>
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-default" title="Clear all filter rules" data-ng-click="resetFiltering()" data-ng-disabled="!active()"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
            </div>
            <div class="pull-right ng-cloak text-muted">
                <span class="loader" data-ng-class="{'loader--active':rulesLoading()}"></span>
                <span data-ng-if="!rulesLoading()"><span data-ng-bind="numberImages()"></span> of {{ $transect->images->count() }} images</span>
            </div>
        </div>

        <ul class="filter-list list-group">
            <li class="list-group-item ng-cloak" data-ng-repeat="rule in getRules() | orderBy: '-'" data-ng-class="{'disabled': rule.ids.$resolved === false}">
                <span data-ng-if="!rule.negate">has</span><span data-ng-if="rule.negate">has no</span> <span data-ng-include="rule.filter.template"></span> <button type="button" class="close pull-right" title="Remove this rule" data-ng-click="removeRule(rule)"><span aria-hidden="true">&times;</span></button>
            </li>
            <li class="ng-cloak list-group-item text-muted" data-ng-if="!getRules().length">No filter rules</li>
        </ul>

        <form class="form-inline add-rule-form" name="ruleform" data-ng-submit="ruleform.$valid && addRule()">
            <div class="form-group">
                <select class="form-control" data-ng-model="data.negate" required>
                    <option value="false">has</option>
                    <option value="true">has no</option>
                </select>
            </div>
            <div class="form-group">
                <select class="form-control" data-ng-model="data.filter" data-ng-options="filter.name for filter in getFilters()" required>
                </select>
            </div>

            <div class="form-group" data-ng-include="data.filter.typeahead"></div>

            <button type="submit" class="btn btn-default">Add</button>
            <p class="help-block" data-ng-bind="getHelpText()"></p>
        </form>
    </div>
</script>
