<div class="col-xs-6">
    <div class="panel panel-default">
        <div class="panel-body">
            @if ($videosCount > 0)
                Created <strong>{{ $videosCount }}</strong> {{ str_plural('video', $videosCount) }} ({{ $videosPercent }}&nbsp;%) which have a total duration of {{ round($duration / 3600, 2) }}&nbsp;h ({{ $durationPercent }}&nbsp;%).
            @else
                Created no videos yet.
            @endif
        </div>
        <ul class="list-group user-stats-list-group">
            @foreach ($videos as $video)
                <li class="list-group-item"><a href="{{route('video', $video->id)}}">{{$video->name}}</a></li>
            @endforeach
        </ul>
    </div>
</div>

<div class="col-xs-6">
    <div class="panel panel-default">
        <div class="panel-body">
            @if ($totalVideoAnnotationLabels > 0)
                Attached <strong>{{ $totalVideoAnnotationLabels }}</strong> {{ str_plural('label', $totalVideoAnnotationLabels) }} ({{ round($relativeVideoAnnotationLabels * 100, 2)}}&nbsp;%) to <strong>{{ $totalVideoAnnotations }}</strong> video {{ str_plural('annotation', $totalVideoAnnotations) }} ({{ round($relativeVideoAnnotations * 100, 2) }}&nbsp;%).
            @else
                Created no video annotations yet.
            @endif
        </div>
    </div>
</div>
