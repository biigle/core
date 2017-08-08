@if(!$type || $type === 'projects')
<h2 class="lead">{{number_format($projectResultCount)}} project results</h2>
<ul class="search-results">
    @foreach ($results as $project)
        <li>
            <div class="row">
                <div class="col-xs-2 search-thumbnail">
                    <a href="{{route('project', $project->id)}}">
                        @if ($project->thumbnail)
                            <img src="{{ asset(config('thumbnails.uri').'/'.$project->thumbnail->uuid.'.'.config('thumbnails.format')) }}" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
                        @else
                            <img src="{{ asset(config('thumbnails.empty_url')) }}">
                        @endif
                    </a>
                </div>
                <div class="col-xs-10">
                    <small class="pull-right text-muted">Updated on {{$project->updated_at->toFormattedDateString()}}</small>
                    <a class="search-results__name" href="{{route('project', $project->id)}}">{{$project->name}}</a><br>
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
                for you. Why don't you <a href="{{route('projects-create')}}" title="Create a new project">create</a> one?
            @endif
        </p>
    @endif
</ul>

@endif
