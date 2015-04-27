<div class="annotator__sidebar" data-ng-controller="SidebarController">
	@include('annotations::index.sidebar.annotations-edit')
	@include('annotations::index.sidebar.annotations-browse')
	<div class="sidebar__controls container-fluid">
		<div id="minimap" class="controls__minimap col-xs-12" data-ng-controller="MinimapController">
			
		</div>
		<div class="controls__panel col-xs-12">
			<button class="btn btn-inverse" data-ng-click="prevImage()" data-ng-disabled="imageLoading" title="Previous image"><span class="glyphicon glyphicon-backward" aria-hidden="true"></span></button>
			<button class="btn btn-inverse" data-ng-click="nextImage()" data-ng-disabled="imageLoading" title="Next image"><span class="glyphicon glyphicon-forward" aria-hidden="true"></span></button>

			<button class="btn btn-inverse" data-ng-click="toggleFoldout('annotations-edit')" title="Edit annotations" data-ng-class="{active:(foldout=='annotations-edit')}"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>
			<button class="btn btn-inverse" data-ng-click="toggleFoldout('annotations-browse')" title="Browse annotations" data-ng-class="{active:(foldout=='annotations-browse')}"><span class="glyphicon glyphicon-search" aria-hidden="true"></span></button>

			<button class="btn btn-inverse" data-ng-click="deleteSelectedAnnotations()" title="Delete selected annotations"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button>
		</div>
	</div>
</div>