@if ($type === 'images')

<h2 class="lead">@if($imageResultCountCapped)more than {{number_format($fileResultCountCap)}}@else{{number_format($imageResultCount)}}@endif image results</h2>
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
            @if ($fileQueryTooShort)
                Please use at least {{$minFileQueryLength}} characters to search for images.
            @else
                We couldn't find any images
                @if ($query)
                    matching '{{$query}}'.
                @else
                    for you.
                @endif
            @endif
        </p>
    @endif
</ul>

@endif
