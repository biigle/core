<div class="sidebar__foldout" data-ng-class="{open:(foldout=='categories')}" data-ng-controller="CategoriesController">
    <div class="categories-search">
        <input class="form-control" type="text" data-ng-model="searchCategory" data-uib-typeahead="category.name for category in categories | filter:$viewValue | limitTo:10" data-typeahead-on-select="selectItem($item)" placeholder="Find category" />

        <button class="btn btn-default pull-right" data-ng-click="toggleFoldout('categories')" title="Collapse this foldout"><span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span></button>
    </div>
    <div class="categories-body">
        <div data-ng-if="favourites.length > 0" class="categories-list">
        <h4 class="categories-list__name" title="Favourites can be selected with the hotkeys 𝟭-𝟵">Favourites</h4>
        <ol class="categories-list__items list-unstyled">
            <li class="label-category-item clearfix" data-ng-class="{selected: isSelected}" data-ng-repeat="item in favourites" title="Select favourite @{{hotkeysMap[$index]}}"></li>
        </ol>
        </div>
        <div data-ng-if="tree[null]" class="categories-list" data-ng-repeat="(project, tree) in categoriesTree">
            <h4 class="categories-list__name">@{{(project==='null') ? 'Global' : project}}</h4>
            <ul class="categories-list__items list-unstyled">
                <li class="label-category-item clearfix" data-ng-class="{open: isOpen, expandable: isExpandable, selected: isSelected}" data-ng-repeat="item in tree[null] | orderBy: 'name'"></li>
            </ul>
        </div>
    </div>
</div>

<script type="text/ng-template" id="label-item.html">
    <div class="item" data-ng-click="selectItem(item)">
        <span class="item__color" data-ng-style="{'background-color': '#' + item.color}"></span> <span class="item__name">@{{item.name}}</span> <span class="glyphicon glyphicon-star-empty pull-right" aria-hidden="true" title="Select as favourite" data-ng-click="toggleFavourite($event, item)" data-ng-if="favouritesLeft() && !isFavourite(item)"></span><span class="glyphicon glyphicon-star pull-right" aria-hidden="true" title="Remove as favourite" data-ng-click="toggleFavourite($event, item)" data-ng-if="isFavourite(item)"></span>
    </div>
</script>

<script type="text/ng-template" id="label-subtree.html">
    <ul class="label-category-subtree list-unstyled">
        <li class="label-category-item clearfix" data-ng-class="{open: isOpen, expandable: isExpandable, selected: isSelected}" data-ng-repeat="item in tree[item.id] | orderBy: 'name'"></li>
    </ul>
</script>
