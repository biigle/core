<?php
$days = Biigle\Modules\Videos\VideoAnnotation::selectRaw('cast(created_at as date) as day, count(id)')
    ->where('created_at', '>=', Carbon\Carbon::today()->subWeek())
    ->groupBy('day')
    ->pluck('count', 'day');
$max = $days->max() ?: 0;
$week = collect([7, 6, 5, 4, 3, 2, 1, 0])->map(function ($item) use ($days, $max) {
    $day = Carbon\Carbon::today()->subDays($item);
    $count = $days->get($day->toDateString(), 0);

    return [
        'day' => $day,
        'count' => $count,
        'percent' => ($max !== 0) ? $count / $max : 0,
    ];
});
$height = 50;
$width = 40;
$total = number_format(Biigle\Modules\Videos\VideoAnnotation::count());
?>

<div class="col-sm-6">
    <div class="panel panel-default">
        <div class="panel-heading">
            <h3 class="panel-title">
                <a href="{{route('search', ['t' => 'videos'])}}">Videos</a>
                <span class="pull-right">{{Biigle\Modules\Videos\Video::count()}}</span>
            </h3>
        </div>
        <div class="panel-body">
            <p class="h1 text-center">{{round(Biigle\Modules\Videos\Video::sum('duration') / 3600, 2)}}&nbsp;h</p>
        </div>
    </div>
</div>
<div class="col-sm-6">
    <div class="panel panel-default">
        <div class="panel-heading">
            <h3 class="panel-title">
                Video Annotations
                <span class="pull-right">{{ $total }}</span>
            </h3>
        </div>
        <div class="panel-body">
            <svg style="display:block; margin:auto;" class="chart" width="300" height="{{ $height + 20 }}">
                <line stroke="#ccc" x1="0" y1="{{$height}}" x2="300" y2="{{$height}}" />
                @foreach($week as $index => $day)
                    <?php $h = round($height * $day['percent']); ?>
                    <g transform="translate({{ $index * $width }}, 0)">
                        <rect fill="#ccc" y="{{$height - $h}}" width="{{ $width / 2 }}" height="{{ $h }}"><title>{{ $day['count'] }}</title></rect>
                        <text fill="{{$day['count'] ? '#ccc' : '#888'}}" x="0" y="{{ $height + 15 }}" dy=".35em">{{ $day['day']->format('D') }}</text>
                    </g>
                @endforeach
            </svg>
        </div>
    </div>
</div>

