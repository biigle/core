@if(!$type || $type === 'projects')
<div class="clearfix">
    @include('search.partials.federated-search-toggle')
    <h2 class="lead">{{number_format($projectResultCount)}} project results</h2>
</div>
<ul class="search-results">
    @foreach ($results as $project)
        <li>
            <div class="row">
                <div class="col-xs-2 search-thumbnail">
                    @if($project instanceof \Biigle\FederatedSearchModel)
                        <a href="{{$project->url}}" title="Show {{$project->name}} in the external BIIGLE instance"  onclick="return confirm('You are now being redirected to an external BIIGLE instance.');">
                    @else
                        <a href="{{route('project', $project->id)}}" title="Show {{$project->name}}">
                    @endif
                        @if ($project->thumbnailUrl)
                            <img src="{{ $project->thumbnailUrl }}" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
                        @else
                            <img src="{{ asset(config('thumbnails.empty_url')) }}">
                        @endif
                    </a>
                </div>
                <div class="col-xs-10">
                    <small class="pull-right text-muted">Updated on {{$project->updated_at->toFormattedDateString()}}</small>
                    @if ($project instanceof \Biigle\FederatedSearchModel)
                        <span class="search-results__name">
                            <a href="{{$project->url}}" title="Show {{$project->name}} in the external BIIGLE instance"  onclick="return confirm('You are now being redirected to an external BIIGLE instance.');">{{$project->name}}</a>
                            <i class="fa fa-external-link-alt" title="This project is from another BIIGLE instance"></i>
                        </span>
                    @else
                        <a class="search-results__name" href="{{route('project', $project->id)}}" title="Show {{$project->name}}">{{$project->name}}</a>
                    @endif
                    <br>
                    {{$project->description}}
                </div>
            </div>
        </li>
    @endforeach

    @if ($results->isEmpty())
        <p class="well well-lg text-center">
            We couldn't find any projects
            @if ($query)
                matching '{{$query}}'.
            @else
                for you.
                @can('create', \Biigle\Project::class)
                    Why don't you <a href="{{route('projects-create')}}" title="Create a new project">create</a> one?
                @endcan
            @endif
        </p>
    @endif
</ul>

@endif
