@if($type === 'volumes')

<h2 class="lead">{{number_format($volumeResultCount)}} volume results</h2>
<ul id="search-results" class="row volume-search-results">
    @foreach ($results as $volume)
        <li class="col-xs-4">
            <a href="{{route('volume', $volume->id)}}" title="Show volume {{$volume->name}}">
                <preview-thumbnail class="preview-thumbnail" v-bind:id="{{$volume->id}}" thumb-uris="{{$volume->thumbnailsUrl->implode(',')}}">
                    @if ($volume->thumbnail)
                        <img src="{{ $volume->thumbnailUrl }}" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
                    @else
                        <img src="{{ asset(config('thumbnails.empty_url')) }}">
                    @endif
                    <figcaption slot="caption">{{$volume->name}}</figcaption>
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

@push('scripts')
<script src="{{ cachebust_asset('vendor/projects/scripts/main.js') }}"></script>
<script src="{{ cachebust_asset('vendor/volumes/scripts/main.js') }}"></script>
@endpush

@push('styles')
<link href="{{ cachebust_asset('vendor/projects/styles/main.css') }}" rel="stylesheet">
<link href="{{ cachebust_asset('vendor/volumes/styles/main.css') }}" rel="stylesheet">
@endpush

@endif
