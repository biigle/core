<figure>
	<img src="{{ url('api/v1/images/'.$transect->images()->first()->id.'/thumb') }}" class="img-thumbnail">
	<figcaption>{{ $transect->name }}</figcaption>
</figure>