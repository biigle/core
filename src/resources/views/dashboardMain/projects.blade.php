@forelse($project->volumes()->orderBy('created_at', 'desc')->take(3)->get() as $volume)
    <div class="col-xs-12 col-sm-6 col-md-3 dashboard__project-volume">
        <a href="{{route('volume', $volume->id)}}" title="Show volume {{$volume->name}}">
            <volume-thumbnail class="volume-thumbnail" v-bind:tid="{{$volume->id}}" uri="{{asset(config('thumbnails.uri'))}}" format="{{config('thumbnails.format')}}">
                @if ($volume->thumbnail)
                    <img src="{{ asset(config('thumbnails.uri').'/'.$volume->thumbnail->uuid.'.'.config('thumbnails.format')) }}"  onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
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
            <span class="glyphicon glyphicon-option-horizontal" aria-hidden="true"></span>
        </a>
    </div>
@endif
