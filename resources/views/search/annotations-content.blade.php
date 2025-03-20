@if ($type === 'images')

<h2 class="lead">{{number_format($imageResultCount)}} image results</h2>
<ul id="search-results" class="row volume-search-results">
    @foreach ($results as $image)
        <li class="col-xs-4">
            <a href="{{ route('annotate', $image->id) }}" title="Annotate image {{$image->filename}}">
                <figure class="image-thumbnail">
                    <img src="{{ thumbnail_url($image->uuid) }}" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
                    <figcaption class="caption">
                        {{ $image->filename }}
                    </figcaption>
                </figure>
            </a>
        </li>
    @endforeach

    @if ($results->isEmpty())
        <p class="well well-lg text-center">
            We couldn't find any images
            @if ($query)
                matching '{{$query}}'.
            @else
                for you.
            @endif
        </p>
    @endif
</ul>

@endif
