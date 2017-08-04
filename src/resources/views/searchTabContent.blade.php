@if($type === 'volumes')
<h2 class="lead">{{$volumeResultCount}} volume results</h2>
<ul class="search-results">
    @foreach ($results as $result)
        <li>
            <small class="pull-right text-muted">Updated on {{$result->updated_at->toFormattedDateString()}}</small>
            <a class="search-results__name" href="{{route('volume', $result->id)}}">{{$result->name}}</a>
        </li>
    @endforeach

    @if ($results->isEmpty())
        <p class="well well-lg text-center">
            We couldn't find any volumes
            @if ($query)
                matching '{{$query}}'.
            @else
                for you.
            @endif
        </p>
    @endif
</ul>
@endif
