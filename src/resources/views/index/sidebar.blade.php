<div class="sidebar__controls">
	<div id="minimap" class="controls__minimap" data-ng-controller="MinimapController">
		
	</div>
	<div class="controls__panel" data-ng-controller="ControlsController">
		<button class="btn btn-inverse" data-ng-click="prevImage()" data-ng-disabled="imageLoading">&lt;</button>
		<button class="btn btn-inverse" data-ng-click="nextImage()" data-ng-disabled="imageLoading">&gt;</button>
		<button class="btn btn-inverse" data-ng-click="toggleDrawing()"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>
		<select data-ng-model="selectedShape" data-ng-options="shape.name for shape in shapes">
		</select>
		<button class="btn btn-inverse" data-ng-click="deleteSelected()"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
	</div>
</div>