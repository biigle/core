<div class="transect-sort-menu-group">
    <button class="btn btn-default transect-menubar__item" data-popover-placement="right" data-uib-popover-template="'sortPopover.html'" type="button" title="Sort images" data-ng-class="{'btn-info':active()}" data-ng-controller="SortController">
        <span class="glyphicon glyphicon-sort" aria-hidden="true"></span>
    </button>
</div>

<script type="text/ng-template" id="sortPopover.html">
    <div class="transect-sort-popover">
        <div class="clearfix">
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-default" title="Sort ascending" data-ng-class="{active: isSortAscending()}" data-ng-click="setSortAscending()"><span class="glyphicon glyphicon-sort-by-attributes" aria-hidden="true"></span></button>
                <button type="button" class="btn btn-default" title="Sort descending" data-ng-class="{active: isSortDescending()}" data-ng-click="setSortDescending()"><span class="glyphicon glyphicon-sort-by-attributes-alt" aria-hidden="true"></span></button>
            </div>
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-default" title="Reset sorting" data-ng-click="resetSorting()" data-ng-disabled="!active()"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
            </div>
            <span class="pull-right">
                <span class="loader" data-ng-class="{'loader--active':isLoading()}"></span>
            </span>
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
