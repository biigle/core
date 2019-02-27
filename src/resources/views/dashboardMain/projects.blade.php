@forelse($project->volumes()->orderBy('created_at', 'desc')->take(3)->get() as $volume)
    <div class="col-xs-12 col-sm-6 col-md-3 dashboard__project-volume">
        <a href="{{route('volume', $volume->id)}}" title="Show volume {{$volume->name}}">
            <volume-thumbnail v-bind:tid="{{$volume->id}}" uri="{{ thumbnail_url() }}" format="{{config('thumbnails.format')}}">
                @if ($volume->thumbnail)
                    <img src="{{ thumbnail_url($volume->thumbnail->uuid) }}"  onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
                @else
                    <img src="{{ asset(config('thumbnails.empty_url')) }}">
                @endif
                <figcaption slot="caption">
                    {{ $volume->name }}
                </figcaption>
            </volume-thumbnail>
        </a>
    </div>
@empty
    <div class="col-xs-12">
        <div class="alert alert-info">
            This project does not contain any volumes yet.
        </div>
    </div>
@endforelse
@if($project->volumes()->count() > 3)
    <div class="col-xs-12 col-sm-6 col-md-3 dashboard__more-volumes">
        <a href="{{route('project', $project->id)}}" class="" title="Show all volumes">
            <span class="fa fa-ellipsis-h" aria-hidden="true"></span>
        </a>
    </div>
@endif
