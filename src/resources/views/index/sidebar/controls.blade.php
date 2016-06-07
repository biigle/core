@inject('modules', 'Dias\Services\Modules')
<div class="sidebar__controls clearfix">
	<div class="btn-group">
        <button class="btn btn-default" data-ng-click="toggleFoldout('settings')" title="Toggle settings foldout" data-ng-class="{active:(foldout=='settings')}"><span class="glyphicon glyphicon-cog" aria-hidden="true"></span></button>
		@if ($editMode)
			<button class="btn btn-default" data-ng-click="toggleFoldout('categories')" title="Toggle label list 𝗧𝗮𝗯" data-ng-class="{active:(foldout=='categories')}" data-ng-controller="SidebarCategoryFoldoutController"><span class="glyphicon glyphicon-list" aria-hidden="true"></span></button>
		@endif
        @foreach ($modules->getMixins('annotationsSidebarControls') as $module => $nestedMixins)
            @include($module.'::annotationsSidebarControls')
        @endforeach
	</div>
</div>
