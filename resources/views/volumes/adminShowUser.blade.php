<div class="col-xs-6">
    <div class="panel panel-default">
        <div class="panel-body">
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
        </div>
        <ul class="list-group user-stats-list-group">
            @foreach ($volumes as $volume)
                <li class="list-group-item"><a href="{{route('volume', $volume->id)}}">{{$volume->name}}</a></li>
            @endforeach
        </ul>
    </div>
</div>
