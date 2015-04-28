<div class="sidebar__controls">
	<button class="btn btn-inverse" data-ng-click="prevImage()" data-ng-disabled="imageLoading" title="Previous image"><span class="glyphicon glyphicon-backward" aria-hidden="true"></span></button>
	<button class="btn btn-inverse" data-ng-click="nextImage()" data-ng-disabled="imageLoading" title="Next image"><span class="glyphicon glyphicon-forward" aria-hidden="true"></span></button>

	<button class="btn btn-inverse" data-ng-click="toggleFoldout('annotations-edit')" title="Edit annotations" data-ng-class="{active:(foldout=='annotations-edit')}"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>
	<button class="btn btn-inverse" data-ng-click="toggleFoldout('annotations-browse')" title="Browse annotations" data-ng-class="{active:(foldout=='annotations-browse')}"><span class="glyphicon glyphicon-search" aria-hidden="true"></span></button>

	<button class="btn btn-inverse" data-ng-click="deleteSelectedAnnotations()" title="Delete selected annotations"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button>
</div>