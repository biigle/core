<a class="activity-item" href="{{route('volume', $item->id)}}" title="Show volume {{$item->name}}">
    <figure class="activity-item-image">
        @if ($item->isImageVolume())
        <i class="icon fas fa-image fa-lg"></i>
        @else
        <i class="icon fas fa-film fa-lg"></i>
        @endif
        <img src="{{ $item->thumbnailUrl }}" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
        <figcaption>{{$item->name}}</figcaption>
    </figure>
</a>
