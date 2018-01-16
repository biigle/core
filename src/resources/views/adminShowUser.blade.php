<div class="col-xs-12">
    <p>
        @if ($volumesCount > 0)
            Created <strong>{{$volumesCount}}</strong> {{$volumesCount === 1 ? 'volume' : 'volumes'}} ({{ $volumesPercent}} %)
            @if ($imagesCount > 0)
                which {{$volumesCount === 1 ? 'contains' : 'contain'}} <strong>{{$imagesCount}}</strong> {{$imagesCount === 1 ? 'image' : 'images'}} ({{ $imagesPercent }} %).
            @else
                which {{$volumesCount === 1 ? 'contains' : 'contain'}} no images.
            @endif
        @else
            Created no volumes yet.
        @endif
    </p>
    <ul>
        @foreach ($volumes as $volume)
            <li><a href="{{route('volume', $volume->id)}}">{{$volume->name}}</a></li>
        @endforeach
    </ul>
</div>
