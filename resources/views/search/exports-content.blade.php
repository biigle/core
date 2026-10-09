@if($type === 'exports')
<h2 class="lead">{{number_format($exportResultCount)}} export results</h2>
<ul class="search-results">
    @foreach ($results as $export)
        <li>
            <span class="pull-right">
                @if ($export->ready_at)
                    <small class="text-muted" title="{{$export->ready_at->toDayDateTimeString()}}">Ready on <time datetime="{{$export->ready_at->toIso8601String()}}">{{$export->ready_at->toFormattedDateString()}}</time></small>
                @else
                    <small class="text-muted" title="Export is pending to be generated">Pending for {{$export->created_at->diffForHumans(null, true)}}</small>
                @endif
                <form action="{{url("api/v1/export/volumes/{$export->id}")}}" method="POST" style="display: inline-block;" onsubmit="return confirm('Are you sure that you want to delete this export?')">
                    <input type="hidden" name="_token" value="{{ csrf_token() }}">
                    <input type="hidden" name="_method" value="DELETE">
                    <button type="submit" class="btn btn-default btn-xs" title="Delete this export"><i class="fa fa-trash-alt"></i></button>
                </form>
            </span>
            <span class="search-results__name">
                @if ($export->ready_at)
                    <a href="{{url("api/v1/export/volumes/{$export->id}")}}">{{$export->description ?: 'Volume export'}}</a>
                @else
                    {{$export->description ?: 'Volume export'}}
                @endif
            </span><br>
            Created on <time datetime="{{$export->created_at->toIso8601String()}}">{{$export->created_at->toFormattedDateString()}}</time>
        </li>
    @endforeach
</ul>
@if ($results->isEmpty())
    <p class="well well-lg text-center">
        We couldn't find any exports
        @if ($query)
            matching '{{$query}}'.
        @else
            for you.
        @endif
    </p>
@endif
@endif
