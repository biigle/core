<div class="sidebar__categories" data-ng-class="{open:(foldout=='categories')}" data-ng-controller="CategoriesController">
	<h3 class="">
		Categories
		<button class="btn btn-inverse pull-right" data-ng-click="toggleFoldout('categories')" title="Collapse this foldout"><span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span></button> 
	</h3>
	<ul class="categories-list list-unstyled">
		<li data-ng-repeat="item in categories[null]" data-ng-include="'tree_item.html'"></li>
	</ul>
	<script type="text/ng-template" id="tree_item.html">
		@{{item.name}}
		<ul class="list-unstyled">
			<li data-ng-repeat="item in categories[item.id]" data-ng-include="'tree_item.html'"></li>
		</ul>
	</script>
</div>