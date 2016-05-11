<script data-ng-controller="AnnotationsFilterController" type="text/ng-template" id="annotationsFilterRule.html">
@{{rule.filter.name}}
</script>

<script data-ng-controller="AnnotationsUserFilterController" type="text/ng-template" id="userFilterRule.html">
@{{rule.filter.name}} @{{rule.data.firstname}} @{{rule.data.lastname}}
</script>

<script type="text/ng-template" id="userFilterTypeahead.html">
    <input class="form-control" placeholder="Select user" data-transect-user-chooser="selectData" data-transect-id="{{$transect->id}}" />
</script>

<script data-ng-controller="AnnotationsLabelFilterController" type="text/ng-template" id="labelFilterRule.html">
@{{rule.filter.name}} @{{rule.data.name}}
</script>

<script type="text/ng-template" id="labelFilterTypeahead.html">
    <input class="form-control" placeholder="Select label" data-transect-label-chooser="selectData" data-transect-id="{{$transect->id}}" />
</script>
