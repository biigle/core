<div class="sidebar__annotations-browse container-fluid" data-ng-class="{open:(foldout=='annotations-browse')}" data-ng-controller="AnnotationsBrowseController">
	<h3 class="col-xs-12">
		Browse annotations
		<button class="btn btn-inverse pull-right" data-ng-click="toggleFoldout('annotations-browse')" title="Collapse this foldout"><span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span></button> 
	</h3>
	<ul class="annotation-list col-xs-12 list-unstyled">
		<li class="annotation-list__item" data-ng-repeat="annotation in annotations" data-ng-click="selectAnnotation($event, annotation.id)" data-ng-class="{selected:(isSelected(annotation.id))}" data-annotation-list-item=""><span class="icon" data-ng-class="shapeClass"></span>#@{{annotation.id}}</li>
		</li>
	</ul>
</div>