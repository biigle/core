<?php
// Do this inline because this is a view mixin and we currently don't have a way to add
// controller code from view mixins.
if (!(\DB::connection() instanceof \Illuminate\Database\SQLiteConnection)) {
    $days = \DB::table('annotations')
        ->select(\DB::raw('cast(created_at as date) as day, count(id)'))
        ->where('created_at', '>=', \Carbon\Carbon::today()->subWeek())
        ->groupBy('day')
        ->pluck('count', 'day');
    $max = max($days->toArray());
    $week = collect([7, 6, 5, 4, 3, 2, 1, 0])->map(function ($item) use ($days, $max) {
        $day = \Carbon\Carbon::today()->subDays($item);
        $count = $days->get($day->toDateString(), 0);

        return [
            'day' => $day,
            'count' => $count,
            'percent' => ($max !== 0) ? $count / $max : 0,
        ];
    });
    $height = 50;
    $width = 40;
}
$total = number_format(Biigle\Annotation::count());
?>

<div class="panel panel-default">
    <div class="panel-heading">
        <h3 class="panel-title">
            Annotations
            @if (isset($week))
                <span class="pull-right">{{ $total }}</span>
            @endif
        </h3>
    </div>
    <div class="panel-body">
        @if (isset($week))
            <svg style="display:block;margin:auto;" class="chart" width="300" height="{{ $height + 20 }}">
                <line stroke="#ccc" x1="0" y1="{{$height}}" x2="300" y2="{{$height}}" />
                @foreach($week as $index => $day)
                    <?php $h = round($height * $day['percent']); ?>
                    <g transform="translate({{ $index * $width }}, 0)">
                        <rect fill="#ccc" y="{{$height - $h}}" width="{{ $width / 2 }}" height="{{ $h }}"><title>{{ $day['count'] }}</title></rect>
                        <text fill="{{$day['count'] ? '#ccc' : '#888'}}" x="0" y="{{ $height + 15 }}" dy=".35em">{{ $day['day']->format('D') }}</text>
                    </g>
                @endforeach
            </svg>
        @else
            <p class="h1 text-center">{{ $total }}</p>
        @endif
    </div>
</div>
