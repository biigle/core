<script data-ng-controller="HasImageLabelFilterController" type="text/ng-template" id="hasImageLabelsFilterRule.html">
@{{rule.filter.name}}
</script>

<script data-ng-controller="ImageLabelUserFilterController" type="text/ng-template" id="imageLabelByUserFilterRule.html">
@{{rule.filter.name}} <strong>@{{rule.data.firstname}} @{{rule.data.lastname}}</strong>
</script>

<script type="text/ng-template" id="imageLabelUserFilterTypeahead.html">
    <input class="form-control" placeholder="Select user" data-transect-filter-user-chooser="selectData" />
</script>

<script data-ng-controller="ImageLabelFilterController" type="text/ng-template" id="imageWithLabelFilterRule.html">
@{{rule.filter.name}} <strong>@{{rule.data.name}}</strong>
</script>

<script type="text/ng-template" id="imageLabelFilterTypeahead.html">
    <input class="form-control" placeholder="Select label" data-transect-image-label-chooser="selectData" data-transect-id="{{$transect->id}}" />
</script>

@foreach ($modules->getMixins('transectsFilters') as $module => $nestedMixins)
    @include($module.'::transectsFilters')
@endforeach
