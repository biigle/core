<div class="transect-menubar">
    <button class="btn btn-default transect-menubar__item" data-popover-placement="right" data-uib-popover-template="'infoPopover.html'" type="button" title="Show transect information">
        <span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span>
    </button>
    @if (!empty($modules->getMixins('transectsFilters')))
        <div class="transect-filter-menu-group">
            <button class="btn btn-default transect-menubar__item" data-popover-placement="right" data-uib-popover-template="'filterPopover.html'" type="button" title="Filter images" data-ng-class="{'btn-info':active()}" data-ng-controller="FilterButtonController">
                <span class="glyphicon glyphicon-filter" aria-hidden="true"></span>
            </button>
        </div>
    @endif
    @foreach ($modules->getMixins('transectsMenubar') as $module => $nestedMixins)
        @include($module.'::transectsMenubar')
    @endforeach
</div>

<script type="text/ng-template" id="infoPopover.html">
    <div>
        <p>
            <strong>{{ $transect->name }}</strong>
            <small>({{ $transect->images->count() }}&nbsp;images)</small>
        </p>
        <ul class="transect-info-popover__projects">
            @foreach($transect->projects as $project)
                <li>{{ $project->name }}</li>
            @endforeach
        </ul>
        @if ($isAdmin)
            <a href="{{ route('transect-edit', $transect->id) }}" class="btn btn-default" title="Edit this transect">Edit</a>
        @endif
    </div>
</script>

@foreach ($modules->getMixins('transectsFilters') as $module => $nestedMixins)
    @include($module.'::transectsFilters')
@endforeach

<script type="text/ng-template" id="filterPopover.html">
    <div class="transect-filter-popover" data-ng-controller="FilterController">
        <div>
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-default" title="Show only images matching the filter rules" data-ng-class="{active: isFilterMode('filter')}" data-ng-click="setFilterMode('filter')">Filter</button>
                <button type="button" class="btn btn-default" title="Show all images but flag those matching the filter rules" data-ng-class="{active: isFilterMode('flag')}" data-ng-click="setFilterMode('flag')">Flag</button>
            </div>
            <div class="pull-right ng-cloak text-muted">
                <span data-ng-if="rulesLoading()">loading...</span>
                <span data-ng-if="!rulesLoading()"><span data-ng-bind="numberImages()"></span> of {{ $transect->images->count() }} images</span>
            </div>
        </div>

        <ul class="filter-list list-group">
            <li class="list-group-item ng-cloak" data-ng-repeat="rule in getRules() | orderBy: '-'" data-ng-class="{'disabled': rule.ids.$resolved === false}">
                <span data-ng-if="!rule.negate">has</span><span data-ng-if="rule.negate">has no</span> <span data-ng-include="rule.filter.name + 'FilterRule.html'"></span> <button type="button" class="close pull-right" title="Remove this rule" data-ng-click="removeRule(rule)"><span aria-hidden="true">&times;</span></button>
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
        </form>
    </div>
</script>
