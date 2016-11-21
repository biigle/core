@forelse($project->transects()->orderBy('created_at', 'desc')->take(3)->get() as $transect)
    <div class="col-xs-12 col-sm-6 col-md-3 dashboard__project-transect">
        <a href="{{route('transect', $transect->id)}}" title="Show transect {{$transect->name}}">
            <transect-thumbnail class="transect-thumbnail" tid="{{$transect->id}}" uri="{{asset(config('thumbnails.uri'))}}" format="{{config('thumbnails.format')}}">
                <?php $image = $transect->images()->orderBy('filename', 'asc')->first(); ?>
                @if ($image && File::exists($image->thumbPath))
                    <img src="{{ asset(config('thumbnails.uri').'/'.$image->uuid.'.'.config('thumbnails.format')) }}">
                @else
                    <img src="{{ asset(config('thumbnails.empty_url')) }}">
                @endif
                <figcaption slot="caption">
                    {{ $transect->name }}
                </figcaption>
            </transect-thumbnail>
        </a>
    </div>
@empty
    <div class="col-xs-12">
        <div class="alert alert-info">
            This project does not contain any transects yet.
        </div>
    </div>
@endforelse
@if($project->transects()->count() > 3)
    <div class="col-xs-12 col-sm-6 col-md-3 dashboard__more-transects">
        <a href="{{route('project', $project->id)}}" class="" title="Show all transects">
            <span class="glyphicon glyphicon-option-horizontal" aria-hidden="true"></span>
        </a>
    </div>
@endif
