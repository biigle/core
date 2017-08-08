@if($type === 'reports')
<h2 class="lead">{{number_format($reportResultCount)}} report results</h2>
<ul class="search-results">
    @foreach ($results as $report)
        <li>
            <small class="pull-right text-muted" title="{{$report->created_at->toDayDateTimeString()}}">Created on <time datetime="{{$report->created_at->toIso8601String()}}">{{$report->created_at->toFormattedDateString()}}</time></small>
            <span class="search-results__name">
                <a href="{{route('show-reports', $report->id)}}">{{$report->subject}}</a>
            </span><br>
            {{$report->name}}
        </li>
    @endforeach

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
</ul>
@endif
