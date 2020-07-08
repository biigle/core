<a class="activity-item" href="{{route('volume', $item->id)}}" title="Show volume {{$item->name}}">
    <figure class="activity-item-image">
        <i class="icon fas fa-images fa-lg"></i>
        <img src="{{ $item->thumbnailUrl }}" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
        <figcaption>{{$item->name}}</figcaption>
    </figure>
</a>
