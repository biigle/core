<div class="sidebar__categories" data-ng-class="{open:(foldout=='categories')}" data-ng-controller="CategoriesController">
    <div class="categories-search">
        <input class="form-control" type="text" data-ng-model="searchCategory" data-typeahead="category.name for category in categories | filter:$viewValue | limitTo:10" data-typeahead-on-select="selectItem($item)" placeholder="Find category" />

        <button class="btn btn-inverse pull-right" data-ng-click="toggleFoldout('categories')" title="Collapse this foldout"><span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span></button>
    </div>
    <div class="categories-body">
        <div data-ng-if="tree[null]" class="categories-list" data-ng-repeat="(project, tree) in categoriesTree">
            <h4 class="categories-list__name">@{{(project==='null') ? 'Global' : project}}</h4>
            <ul class="categories-list__items list-unstyled">
                <li class="label-category-item" data-ng-class="{open: isOpen, expandable: isExpandable, selected: isSelected}" data-ng-repeat="item in tree[null] | orderBy: 'name'"></li>
            </ul>
        </div>
    </div>
</div>

<script type="text/ng-template" id="label-item.html">
    <span class="item__name" data-ng-click="selectItem(item)">@{{item.name}}</span>
</script>

<script type="text/ng-template" id="label-subtree.html">
    <ul class="label-category-subtree list-unstyled">
        <li class="label-category-item" data-ng-class="{open: isOpen, expandable: isExpandable, selected: isSelected}" data-ng-repeat="item in tree[item.id] | orderBy: 'name'"></li>
    </ul>
</script>
