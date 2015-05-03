<div class="sidebar__categories" data-ng-class="{open:(foldout=='categories')}" data-ng-controller="CategoriesController">
	<h3 class="">
		Label categories
		<button class="btn btn-inverse pull-right" data-ng-click="toggleFoldout('categories')" title="Collapse this foldout"><span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span></button> 
	</h3>
	<div class="categories-search">
		<input class="form-control" type="text" data-ng-model="searchCategory" data-typeahead="category.name for category in categories | filter:$viewValue | limitTo:10" data-typeahead-on-select="selectItem($item)" placeholder="Find category" />
	</div>
	<ul class="categories-list list-unstyled">
		<li class="label-category-item" data-ng-class="{open: isOpen, expandable: isExpandable, selected: isSelected}" data-ng-repeat="item in categoriesTree[null]"></li>
	</ul>
</div>