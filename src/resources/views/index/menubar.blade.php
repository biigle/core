<div class="transect-menubar">
    <button class="btn btn-default transect-menubar__item" data-popover-placement="right" data-uib-popover-template="'infoPopover.html'" type="button" title="Show transect information">
        <span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span>
    </button>
    <button class="btn btn-default transect-menubar__item" data-popover-placement="right" data-uib-popover-template="'settingsPopover.html'" type="button" title="Show settings">
        <span class="glyphicon glyphicon-cog" aria-hidden="true"></span>
    </button>
    @if (!empty($modules->getMixins('transectsFilters')))
        <button class="btn btn-default transect-menubar__item" data-popover-placement="right" data-uib-popover-template="'filterPopover.html'" type="button" title="Filter images" data-ng-class="{'btn-info':flags.hasActiveFilters()}">
            <span class="glyphicon glyphicon-filter" aria-hidden="true"></span>
        </button>
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
    </div>
</script>

<script type="text/ng-template" id="settingsPopover.html">
    <div class="transect-settings-popover">
        <div>
            <span class="settings-label">
                Flags&nbsp;<span class="glyphicon glyphicon-question-sign help-icon" aria-hidden="true" title="Flags mark images with special properties, e.g. those having annotations."></span>
            </span>
            <span class="settings-control">
                <div class="btn-group">
                    <button type="button" class="btn btn-default" data-ng-class="{active: settings.get('show-flags')}" data-ng-click="settings.set('show-flags', true)">Show</button>
                    <button type="button" class="btn btn-default" data-ng-class="{active: !settings.get('show-flags')}" data-ng-click="settings.set('show-flags', false)">Hide</button>
                </div>
            </span>
        </div>
    </div>
</script>

<script type="text/ng-template" id="filterPopover.html">
    <div class="transect-filter-popover" data-ng-controller="FilterController">
        <strong>Filter</strong> <small><span data-ng-bind="currentNoImages">2</span> of <span data-ng-bind="totalNoImages">4</span> images</small>
        <ul class="list-group filter-list">
            @foreach ($modules->getMixins('transectsFilters') as $module => $nestedMixins)
                @include($module.'::transectsFilters')
            @endforeach
        </ul>
    </div>
</script>
