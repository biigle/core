@if(!$type || $type === 'projects')
<h2 class="lead">{{$projectResultCount}} project results</h2>
<ul class="search-results">
    @foreach ($results as $result)
        <li>
            <small class="pull-right text-muted">Updated on {{$result->updated_at->toFormattedDateString()}}</small>
            <a class="search-results__name" href="{{route('project', $result->id)}}">{{$result->name}}</a><br>
            {{$result->description}}
        </li>
    @endforeach

    @if ($results->isEmpty())
        <p class="well well-lg text-center">
            We couldn't find any projects
            @if ($query)
                matching '{{$query}}'.
            @else
                for you.
            @endif
        </p>
    @endif
</ul>
@endif
