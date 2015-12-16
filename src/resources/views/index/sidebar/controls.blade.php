@inject('modules', 'Dias\Services\Modules')
<div class="sidebar__controls clearfix">
	<div class="btn-group">
		<button class="btn btn-inverse" data-ng-click="prevImage()" data-ng-disabled="imageLoading" title="Previous image 𝗟𝗲𝗳𝘁 𝗮𝗿𝗿𝗼𝘄"><span class="glyphicon glyphicon-step-backward" aria-hidden="true"></span></button>
		<button class="btn btn-inverse" data-ng-click="nextImage()" data-ng-disabled="imageLoading" title="Next image 𝗥𝗶𝗴𝗵𝘁 𝗮𝗿𝗿𝗼𝘄/𝗦𝗽𝗮𝗰𝗲"><span class="glyphicon glyphicon-step-forward" aria-hidden="true"></span></button>
        <button class="btn btn-inverse" data-ng-click="toggleFoldout('settings')" title="Toggle settings foldout" data-ng-class="{active:(foldout=='settings')}"><span class="glyphicon glyphicon-cog" aria-hidden="true"></span></button>

		@if ($editMode)
			<button class="btn btn-inverse" data-ng-click="toggleFoldout('categories')" title="Toggle label category list 𝗧𝗮𝗯" data-ng-class="{active:(foldout=='categories')}"><span class="glyphicon glyphicon-list" aria-hidden="true"></span></button>
		@endif
        @foreach ($modules->getMixins('annotationsSidebarControls') as $module => $nestedMixins)
            @include($module.'::annotationsSidebarControls')
        @endforeach
	</div>
	@if ($editMode)
        <div class="pull-right">
            <button class="btn btn-inverse" data-ng-click="deleteSelectedAnnotations()" title="Delete selected annotations 𝗗𝗲𝗹"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button>
        </div>
	@endif
</div>
