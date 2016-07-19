@inject('modules', 'Dias\Services\Modules')
<div class="sidebar__controls clearfix">
    <div class="btn-group">
		@if ($editMode)
            <button class="btn btn-default" data-ng-click="toggleFoldout('settings')" title="Toggle settings foldout" data-ng-class="{active:(foldout=='settings')}"><span class="glyphicon glyphicon-cog" aria-hidden="true"></span></button>
			<button class="btn btn-default" data-ng-click="toggleFoldout('categories')" title="Toggle label list 𝗧𝗮𝗯" data-ng-class="{active:(foldout=='categories')}" data-ng-controller="SidebarCategoryFoldoutController"><span class="glyphicon glyphicon-list" aria-hidden="true"></span></button>
		@endif
        <button class="btn btn-default" data-ng-click="toggleFoldout('filters')" title="@{{supportsFilters() ? 'Toggle image filter foldout' : 'Your machine does not support filters for this image'}}" data-ng-class="{active:(foldout=='filters')}" data-ng-controller="FiltersControlController" data-ng-disabled="!supportsFilters()"><span class="glyphicon glyphicon-adjust" aria-hidden="true"></span></button>
        @foreach ($modules->getMixins('annotationsSidebarControls') as $module => $nestedMixins)
            @include($module.'::annotationsSidebarControls')
        @endforeach
	</div>
</div>
