<div class="transect__images" data-ng-controller="ImagesController" data-transect-id="{{ $transect->id }}">
	<figure class="transect-figure" data-ng-repeat="id in images | limitTo: limit" data-ng-class="{selected:(id===active.image)}">
		<a data-ng-href="@{{ getImageUrl(id) }}" data-ng-click="imageSelected($event, id)">
			<img data-ng-src="{{ url('api/v1/images/') }}/@{{ id }}/thumb">
		</a>
	</figure>
</div>