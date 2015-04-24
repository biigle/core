<div class="sidebar__controls">
	<div id="minimap" class="controls__minimap" data-ng-controller="MinimapController">
		
	</div>
	<div class="controls__panel container-fluid" data-ng-controller="ControlsController">
		<button class="btn btn-inverse col-sm-5" data-ng-click="prevImage()" data-ng-disabled="imageLoading" title="Previous image"><span class="glyphicon glyphicon-backward" aria-hidden="true"></span></button>
		<button class="btn btn-inverse col-sm-5 col-sm-offset-2" data-ng-click="nextImage()" data-ng-disabled="imageLoading" title="Next image"><span class="glyphicon glyphicon-forward" aria-hidden="true"></span></button>

		<select class="form-control col-sm-12" data-ng-model="selectedShape" data-ng-options="shape.name for shape in shapes" title="Annotation shape">
		</select>

		<button class="btn btn-inverse col-sm-5" data-ng-click="toggleDrawing()" title="Draw/edit annotations"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>
		<button class="btn btn-inverse col-sm-5 col-sm-offset-2" data-ng-click="deleteSelected()"  title="Delete annotation(s)"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
	</div>
</div>