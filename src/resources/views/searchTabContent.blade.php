@if($type === 'label-trees')
<h2 class="lead">{{$labelTreeResultCount}} label tree results</h2>
<ul class="search-results">
    @foreach ($results as $result)
        <li>
            <small class="pull-right text-muted">Updated on {{$result->updated_at->toFormattedDateString()}}</small>
            <span class="search-results__name">
                @if ($result->visibility_id === Biigle\Visibility::$private->id)
                    <small class="text-muted glyphicon glyphicon-lock" title="This label tree is private"></small>
                @endif
                <a href="{{route('label-trees', $result->id)}}">{{$result->name}}</a>
            </span><br>
            {{$result->description}}
        </li>
    @endforeach

    @if ($results->isEmpty())
        <p class="well well-lg text-center">
            We couldn't find any label trees
            @if ($query)
                matching '{{$query}}'.
            @else
                for you.
            @endif
        </p>
    @endif
</ul>
@endif
