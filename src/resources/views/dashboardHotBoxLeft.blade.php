@if($recentImage)
    <div class="panel panel-info">
        <div class="panel-heading">Most recently annotated image</div>
        <div class="panel-body dashboard__hot-thumbnail">
            <figure class="image-thumbnail">
                <a href="{{ route('annotate', $recentImage->id) }}" title="Show image {{$recentImage->filename}}">
                    <img src="{{ thumbnail_url($recentImage->uuid) }}" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}';">
                    <figcaption class="caption">
                        {{ $recentImage->filename }}
                    </figcaption>
                </a>
            </figure>
        </div>
    </div>
@endif
