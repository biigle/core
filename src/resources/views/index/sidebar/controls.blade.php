<div class="sidebar__controls" data-ng-controller="ControlsController" data-select-category="Please select a label category first.">
	<div class="btn-group">
		<button class="btn btn-inverse" data-ng-click="prevImage()" data-ng-disabled="imageLoading" title="Previous image"><span class="glyphicon glyphicon-backward" aria-hidden="true"></span></button>
		<button class="btn btn-inverse" data-ng-click="nextImage()" data-ng-disabled="imageLoading" title="Next image"><span class="glyphicon glyphicon-forward" aria-hidden="true"></span></button>

		<button class="btn btn-inverse" data-ng-click="toggleFoldout('categories')" title="Toggle label category list" data-ng-class="{active:(foldout=='categories')}"><span class="glyphicon glyphicon-list" aria-hidden="true"></span></button>
	</div>
	<div class="btn-group">
		<button class="btn btn-inverse icon icon-point" data-ng-click="selectShape('Point')" data-ng-class="{active:(selectedShape=='Point')}" title="Set a point"></button> 
		<button class="btn btn-inverse icon icon-polygon" data-ng-click="selectShape('Polygon')" data-ng-class="{active:(selectedShape=='Polygon')}" title="Draw a polygon"></button> 
		<button class="btn btn-inverse icon icon-linestring" data-ng-click="selectShape('LineString')" data-ng-class="{active:(selectedShape=='LineString')}" title="Draw a line string"></button> 
		<button class="btn btn-inverse icon icon-circle" data-ng-click="selectShape('Circle')" data-ng-class="{active:(selectedShape=='Circle')}" title="Draw a circle"></button>

		<button class="btn btn-inverse" data-ng-click="deleteSelectedAnnotations()" title="Delete selected annotations"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></button>
	</div>
</div>