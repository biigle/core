<a class="activity-item" href="{{route('video', $item->id)}}" title="Show video {{$item->name}}">
    <figure class="activity-item-image">
        <i class="icon fas fa-video fa-lg"></i>
        <img src="{{ $item->thumbnailUrl }}" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
        <figcaption>{{$item->name}}</figcaption>
    </figure>
</a>
