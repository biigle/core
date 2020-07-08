@if ($item instanceof Biigle\Modules\Videos\Video)
    <a href="{{--TODO route('video', $item->id)--}}" title="Show video {{$item->name}}">
        <preview-thumbnail class="preview-thumbnail" v-bind:id="{{$item->id}}" thumb-uris="{!! $item->thumbnailsUrl->implode(',') !!}" icon="video">
@else
    <a href="{{route('volume', $item->id)}}" title="Show volume {{$item->name}}">
        <preview-thumbnail class="preview-thumbnail" v-bind:id="{{$item->id}}" thumb-uris="{!! $item->thumbnailsUrl->implode(',') !!}" icon="images">
@endif
        @if ($item->thumbnail)
            <img src="{{ $item->thumbnailUrl }}"  onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
        @else
            <img src="{{ asset(config('thumbnails.empty_url')) }}">
        @endif
        <figcaption slot="caption">
            {{ $item->name }}
        </figcaption>
    </preview-thumbnail>
</a>
