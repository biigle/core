@if($type === 'reports')
<h2 class="lead">{{number_format($reportResultCount)}} report results</h2>
<ul class="search-results">
    @foreach ($results as $report)
        <li>
            <span class="pull-right">
                @if ($report->ready_at)
                    <small class="text-muted" title="{{$report->ready_at->toDayDateTimeString()}}">Created on <time datetime="{{$report->ready_at->toIso8601String()}}">{{$report->ready_at->toFormattedDateString()}}</time></small>
                @else
                    <small class="text-muted" title="Report is pending to be generated">Pending for {{$report->created_at->diffForHumans(null, true)}}</small>
                @endif
                <form action="{{route('destroy-reports', $report->id)}}" method="POST" style="display: inline-block;" onsubmit="return confirm('Are you sure that you want to delete this report?')">
                    <input type="hidden" name="_token" value="{{ csrf_token() }}">
                    <input type="hidden" name="_method" value="DELETE">
                    <button type="submit" class="btn btn-default btn-xs" title="Delete this report"><i class="fa fa-trash-alt"></i></button>
                </form>
            </span>
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
