<figure class="transects-dashboard__thumb">
	<a href="{{ route('transect', $transect->id) }}">
		<img src="{{ url('api/v1/images/'.$transect->images()->first()->id.'/thumb') }}">
		<figcaption class="caption">{{ $transect->name }}</figcaption>
	</a>
</figure>
