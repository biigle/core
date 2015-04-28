<div class="sidebar__annotations-edit container-fluid" data-ng-class="{open:(foldout=='annotations-edit')}" data-ng-controller="AnnotationsEditController">
	<h3 class="col-xs-12">
		Edit annotations
		<button class="btn btn-inverse pull-right" data-ng-click="toggleFoldout('annotations-edit')" title="Collapse this foldout"><span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span></button> 
	</h3>
	<div class="btn-group col-xs-12">
		<button class="btn btn-inverse col-xs-3 icon icon-point" data-ng-click="selectShape('Point')" data-ng-class="{active:(selectedShape=='Point')}" title="Set a point"></button> 
		<button class="btn btn-inverse col-xs-3 icon icon-polygon" data-ng-click="selectShape('Polygon')" data-ng-class="{active:(selectedShape=='Polygon')}" title="Draw a polygon"></button> 
		<button class="btn btn-inverse col-xs-3 icon icon-linestring" data-ng-click="selectShape('LineString')" data-ng-class="{active:(selectedShape=='LineString')}" title="Draw a line string"></button> 
		<button class="btn btn-inverse col-xs-3 icon icon-circle" data-ng-click="selectShape('Circle')" data-ng-class="{active:(selectedShape=='Circle')}" title="Draw a circle"></button> 
	</div>
</div>