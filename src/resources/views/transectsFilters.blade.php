<li data-ng-controller="AnnotationsFilterController">
    <span class="figure-flag has-annotation"></span>
    <span class="btn-group">
        <button class="btn btn-default" title="Show only images that do not have annotations" data-ng-click="toggleNegateFilter()" data-ng-class="{active: flag.activeNegateFilter}">
            Not
        </button>
        <button class="btn btn-default" title="Show only images that have annotations" data-ng-click="toggleFilter()" data-ng-class="{active: flag.activeFilter || flag.activeNegateFilter}">
            Having Annotations
        </button>
    </span>
</li>
