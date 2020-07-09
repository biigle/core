<a class="activity-item" href="{{route('annotate', $item->id)}}" title="Show image {{$item->filename}}">
    <figure class="activity-item-image">
        <i class="icon fas fa-image fa-lg"></i>
        <img src="{{ thumbnail_url($item->uuid) }}" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
        <figcaption>{{$item->filename}}</figcaption>
    </figure>
</a>
