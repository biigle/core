@if($recentImage)
    <div class="panel panel-info">
        <div class="panel-heading">Most recently annotated image</div>
        <div class="panel-body dashboard__hot-thumbnail">
            <figure class="image-thumbnail">
                <a href="{{ route('annotate', $recentImage->id) }}" title="Show image {{$recentImage->filename}}">
                    @if (File::exists($recentImage->thumbPath))
                        <img src="{{ url('api/v1/images/'.$recentImage->id.'/thumb') }}">
                    @else
                        <img src="{{ asset(config('thumbnails.empty_url')) }}">
                    @endif
                    <figcaption class="caption">
                        {{ $recentImage->filename }}
                    </figcaption>
                </a>
            </figure>
        </div>
    </div>
@endif
