<div class="transect-menubar">
    @if ($isAdmin)
        <a href="{{ route('transect-edit', $transect->id) }}" class="btn btn-default transect-menubar__item" title="Edit this transect"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
    @endif
    @if (!empty($modules->getMixins('transectsFilters')))
        <div class="transect-filter-menu-group">
            <button class="btn btn-default transect-menubar__item" data-popover-placement="right" data-uib-popover-template="'filterPopover.html'" type="button" title="Filter images" data-ng-class="{'btn-info':active()}" data-ng-controller="FilterController">
                <span class="glyphicon glyphicon-filter" aria-hidden="true"></span>
            </button>
        </div>
    @endif
    <div class="transect-sort-menu-group">
        <button class="btn btn-default transect-menubar__item" data-popover-placement="right" data-uib-popover-template="'sortPopover.html'" type="button" title="Sort images" data-ng-class="{'btn-info':active()}" data-ng-controller="SortController">
            <span class="glyphicon glyphicon-sort" aria-hidden="true"></span>
        </button>
    </div>
    @foreach ($modules->getMixins('transectsMenubar') as $module => $nestedMixins)
        @include($module.'::transectsMenubar')
    @endforeach
</div>

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
                <button type="button" class="btn btn-default" title="Clear all filter rules" data-ng-click="resetFiltering()"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
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

<script type="text/ng-template" id="sortPopover.html">
    <div class="transect-sort-popover">
        <div class="clearfix">
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-default" title="Sort ascending" data-ng-class="{active: isSortAscending()}" data-ng-click="setSortAscending()"><span class="glyphicon glyphicon-sort-by-attributes" aria-hidden="true"></span></button>
                <button type="button" class="btn btn-default" title="Sort descending" data-ng-class="{active: isSortDescending()}" data-ng-click="setSortDescending()"><span class="glyphicon glyphicon-sort-by-attributes-alt" aria-hidden="true"></span></button>
            </div>
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-default" title="Reset sorting" data-ng-click="resetSorting()"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
            </div>
            <span class="pull-right text-muted" data-ng-if="isLoading()">loading...</span>
        </div>

        <div class="list-group sorter-list-group">
            <button type="button" class="list-group-item" title="Sort images by filename" data-ng-click="toggle()" data-ng-class="{active: active()}" data-ng-controller="SortByFilenameController">Filename</button>

            <button type="button" class="list-group-item" title="Sort images randomly" data-ng-click="toggle()" data-ng-class="{active: active()}" data-ng-controller="SortRandomController">Random</button>

            @foreach ($modules->getMixins('transectsSorters') as $module => $nestedMixins)
                @include($module.'::transectsSorters')
            @endforeach
        </div>
    </div>
</script>
