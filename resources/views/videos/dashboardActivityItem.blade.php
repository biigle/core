<a class="activity-item" href="{{route('video-annotate', $item->id)}}" title="Show video {{$item->name}}">
    <figure class="activity-item-image">
        <i class="icon fas fa-film fa-lg"></i>
        <img src="{{ $item->thumbnailUrl }}" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
        <figcaption>{{$item->name}}</figcaption>
    </figure>
</a>
