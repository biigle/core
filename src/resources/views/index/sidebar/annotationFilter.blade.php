<form class="sidebar__annotation-filter ng-cloak form-inline" data-ng-if="isAnnotationFilterOpen()" data-ng-controller="AnnotationFilterController">
    <select class="form-control" data-ng-options="filter.name for filter in available.filters" data-ng-model="selected.filter"></select>
    <input class="form-control" type="text" name="param" data-ng-model="selected.input" data-uib-typeahead="item.name for item in getTypeaheadItems() | filter:$viewValue | limitTo:5" data-typeahead-on-select="selectFilter($item)">
</form>
