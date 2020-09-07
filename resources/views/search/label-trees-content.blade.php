@if($type === 'label-trees')
<h2 class="lead">{{number_format($labelTreeResultCount)}} label tree results</h2>
<ul class="search-results">
    @foreach ($results as $tree)
        <li>
            <small class="pull-right text-muted">Updated on {{$tree->updated_at->toFormattedDateString()}}</small>
            <span class="search-results__name">
                @if ($tree instanceof \Biigle\FederatedSearchModel)
                    <a href="{{$tree->url}}" title="Show {{$tree->name}} in the external BIIGLE instance" onclick="return confirm('You are now being redirected to an external BIIGLE instance.');">{{$tree->name}}</a> <i class="fa fa-external-link-alt" title="This project is from another BIIGLE instance"></i>
                @else
                    <a href="{{route('label-trees', $tree->id)}}" title="Show {{$tree->name}}">{{$tree->name}}</a>
                @endif
            </span>
            @if ($tree->visibility_id === Biigle\Visibility::privateId())
                <span class="label label-default label-hollow" title="This label tree is private">Private</span>
            @endif
            <br>
            {{$tree->description}}
        </li>
    @endforeach

    @if ($results->isEmpty())
        <p class="well well-lg text-center">
            We couldn't find any label trees
            @if ($query)
                matching '{{$query}}'.
            @else
                for you.
                @can('create', \Biigle\LabelTree::class)
                    Why don't you <a href="{{route('label-trees-create')}}" title="Create a new label tree">create</a> one?
                @endcan
            @endif
        </p>
    @endif
</ul>
@endif
