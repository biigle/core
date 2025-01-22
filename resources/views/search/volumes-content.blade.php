@if($type === 'volumes')
<div class="clearfix">
    @include('search.partials.federated-search-toggle')
    <h2 class="lead">{{number_format($volumeResultCount)}} volume results</h2>
</div>
<ul id="search-results" class="row volume-search-results">
    @foreach ($results as $volume)
        <li class="col-xs-4">
            @if ($volume instanceof \Biigle\FederatedSearchModel)
                <a href="{{$volume->url}}" title="Show volume {{$volume->name}} in the external BIIGLE instance" onclick="return confirm('You are now being redirected to an external BIIGLE instance.');">
                    <preview-thumbnail class="preview-thumbnail" id="external-{{$volume->id}}'" thumb-uris="{{$volume->thumbnailUrls->implode(',')}}" icon="external-link-alt">
            @else
                <a href="{{route('volume', $volume->id)}}" title="Show volume {{$volume->name}}">
                    <preview-thumbnail class="preview-thumbnail" id="internal-{{$volume->id}}" thumb-uris="{{$volume->thumbnailsUrl->implode(',')}}" @if ($volume->isImageVolume()) icon="image" @else icon="film" @endif>
            @endif
                    @if ($volume->thumbnailUrl)
                        <img src="{{ $volume->thumbnailUrl }}" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
                    @else
                        <img src="{{ asset(config('thumbnails.empty_url')) }}">
                    @endif
                    <template #caption>
                        <figcaption>{{$volume->name}}</figcaption>
                    </template>
                </preview-thumbnail>
            </a>
        </li>
    @endforeach

    @if ($results->isEmpty())
        <p class="well well-lg text-center">
            We couldn't find any volumes
            @if ($query)
                matching '{{$query}}'.
            @else
                for you.
            @endif
        </p>
    @endif
</ul>

@endif
