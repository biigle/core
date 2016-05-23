<figure class="transects-dashboard__thumb">
	<a href="{{ route('transect', $transect->id) }}">
        @if ($transect->images()->exists())
            <?php $image = $transect->images()->first() ?>
            @if (File::exists($image->thumbPath))
                <img src="{{ url('api/v1/images/'.$image->id.'/thumb') }}">
            @else
                <img src="{{ asset(config('thumbnails.empty_url')) }}">
            @endif
        @endif
		<figcaption class="caption">{{ $transect->name }}</figcaption>
	</a>
</figure>
