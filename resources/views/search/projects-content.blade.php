@if(!$type || $type === 'projects')
<h2 class="lead">{{number_format($projectResultCount)}} project results</h2>
<ul class="search-results">
    @foreach ($results as $project)
        <li>
            <div class="row">
                <div class="col-xs-2 search-thumbnail">
                    @if($project->external)
                        <a href="{{$project->url}}">
                    @else
                        <a href="{{route('project', $project->id)}}">
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
                    @if ($project->external)
                        <a class="search-results__name" href="{{$project->url}}">{{$project->name}}</a>
                        <span class="label label-default label-hollow" title="This project is from another BIIGLE instance">External</span>
                    @else
                        <a class="search-results__name" href="{{route('project', $project->id)}}">{{$project->name}}</a>
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
