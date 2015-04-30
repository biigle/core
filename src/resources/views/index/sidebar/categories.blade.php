<div class="sidebar__categories" data-ng-class="{open:(foldout=='categories')}" data-ng-controller="CategoriesController">
	<h3 class="">
		Label categories
		<button class="btn btn-inverse pull-right" data-ng-click="toggleFoldout('categories')" title="Collapse this foldout"><span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span></button> 
	</h3>
	<div>
		<h4>Confidence: <span class="label confidence-label" data-ng-class="confidenceClass" data-ng-bind="confidence | number:2"></span></h4>
		<input class="confidence-range" type="range" min="0.0" max="1.0" step="0.01" data-ng-model="confidence">
	</div>
	<ul class="categories-list list-unstyled">
		<li class="label-category-item" data-ng-class="{open: isOpen, expandable: isExpandable, selected: (selectedID == item.id)}" data-ng-repeat="item in categories[null]"></li>
	</ul>
</div>