@if($type === 'reports')
<h2 class="lead">{{number_format($reportResultCount)}} report results</h2>
<ul class="search-results">
    @foreach ($results as $report)
        <li>
            @if ($report->ready_at)
                <small class="pull-right text-muted" title="{{$report->ready_at->toDayDateTimeString()}}">Created on <time datetime="{{$report->ready_at->toIso8601String()}}">{{$report->ready_at->toFormattedDateString()}}</time></small>
            @else
                <small class="pull-right text-muted" title="Report is pending to be generated">Pending for {{$report->created_at->diffForHumans(null, true)}}</small>
            @endif
            <span class="search-results__name">
                @if ($report->ready_at)
                    <a href="{{route('show-reports', $report->id)}}">{{$report->subject}}</a>
                @else
                    {{$report->subject}}
                @endif
            </span><br>
            {{$report->name}}
        </li>
    @endforeach
</ul>
@if ($results->isEmpty())
    <p class="well well-lg text-center">
        We couldn't find any reports
        @if ($query)
            matching '{{$query}}'.
        @else
            for you.
        @endif
    </p>
@endif
@endif
