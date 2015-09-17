<div class="sidebar__controls clearfix">
	<div class="btn-group">
		<button class="btn btn-inverse" data-ng-click="prevImage()" data-ng-disabled="imageLoading" title="Previous image"><span class="glyphicon glyphicon-backward" aria-hidden="true"></span></button>
		<button class="btn btn-inverse" data-ng-click="nextImage()" data-ng-disabled="imageLoading" title="Next image"><span class="glyphicon glyphicon-forward" aria-hidden="true"></span></button>

		@if ($editMode)
			<button class="btn btn-inverse" data-ng-click="toggleFoldout('categories')" title="Toggle label category list" data-ng-class="{active:(foldout=='categories')}"><span class="glyphicon glyphicon-list" aria-hidden="true"></span></button>
		@endif
	</div>
	@if ($editMode)
        <div class="pull-right">
            <button class="btn btn-inverse" data-ng-click="deleteSelectedAnnotations()" title="Delete selected annotations"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button>
        </div>
	@endif
</div>
