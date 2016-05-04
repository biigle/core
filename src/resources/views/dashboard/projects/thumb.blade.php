<figure class="transects-dashboard__thumb">
	<a href="{{ route('transect', $transect->id) }}">
        @if ($transect->images()->exists())
		  <img src="{{ url('api/v1/images/'.$transect->images()->first()->id.'/thumb') }}">
        @endif
		<figcaption class="caption">{{ $transect->name }}</figcaption>
	</a>
</figure>
