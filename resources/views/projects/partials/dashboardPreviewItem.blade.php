<a href="{{route('volume', $item->id)}}" title="Show volume {{$item->name}}">
@if ($item->isImageVolume())
    <preview-thumbnail class="preview-thumbnail" v-bind:id="{{$item->id}}" thumb-uris="{!! $item->thumbnailsUrl->implode(',') !!}" icon="image">
@else
    <preview-thumbnail class="preview-thumbnail" v-bind:id="{{$item->id}}" thumb-uris="{!! $item->thumbnailsUrl->implode(',') !!}" icon="film">
@endif
        @if ($item->thumbnail)
            <img src="{{ $item->thumbnailUrl }}"  onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
        @else
            <img src="{{ asset(config('thumbnails.empty_url')) }}">
        @endif
        <template #caption>
            <figcaption>
                {{ $item->name }}
            </figcaption>
        </template>
    </preview-thumbnail>
</a>
