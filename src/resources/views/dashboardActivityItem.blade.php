<a class="activity-item" href="{{route('annotate', $item->id)}}" title="Annotate image {{$item->name}}">
    <figure class="activity-item-image">
        <span class="label label-default">Image</span>
        <img src="{{ thumbnail_url($item->uuid) }}" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
        <figcaption>{{$item->filename}}</figcaption>
    </figure>
</a>
