@extends('app')
@inject('modules', 'Dias\Services\Modules')

@section('title'){{ trans('dias.titles.dashboard') }}@stop

@push('styles')
	@foreach ($modules->getMixins('dashboardStyles') as $module => $nestedMixins)
		@include($module.'::dashboardStyles')
	@endforeach
@endpush

@push('scripts')
	@foreach ($modules->getMixins('dashboardScripts') as $module => $nestedMixins)
		@include($module.'::dashboardScripts')
	@endforeach
@endpush

@section('content')
<div class="container">
    <div class="row">
        @if($recentImage)
            <div class="col-md-6">
                <div class="panel panel-info">
                    <div class="panel-heading">Most recently annotated image</div>
                    <div class="panel-body">
                        <figure class="image-thumbnail dashboard__recent-image">
                            @if(Route::has('annotate'))
                                <a href="{{ route('annotate', $recentImage->id) }}">
                            @endif
                                @if (File::exists($recentImage->thumbPath))
                                    <img src="{{ url('api/v1/images/'.$recentImage->id.'/thumb') }}">
                                @else
                                    <img src="{{ asset(config('thumbnails.empty_url')) }}">
                                @endif
                                <figcaption class="caption">
                                    {{ $recentImage->filename }}
                                </figcaption>
                            @if(Route::has('annotate'))
                                </a>
                            @endif
                        </figure>
                    </div>
                </div>
            </div>
        @endif
        @if($recentTransect)
            <div class="col-md-6">
                <div class="panel panel-info">
                    <div class="panel-heading">Most recently edited transect</div>
                    <div class="panel-body">
                        <figure class="image-thumbnail dashboard__recent-transect">
                            @if(Route::has('transect'))
                                <a href="{{ route('transect', $recentTransect->id) }}">
                            @endif
                                @if (File::exists($recentTransectImage->thumbPath))
                                    <img src="{{ url('api/v1/images/'.$recentTransectImage->id.'/thumb') }}">
                                @else
                                    <img src="{{ asset(config('thumbnails.empty_url')) }}">
                                @endif
                                <figcaption class="caption">
                                    {{ $recentTransect->name }}
                                </figcaption>
                            @if(Route::has('transect'))
                                </a>
                            @endif
                        </figure>
                    </div>
                </div>
            </div>
        @endif
    </div>
	@foreach ($modules->getMixins('dashboard') as $module => $nestedMixins)
		@include($module.'::dashboard', array('mixins' => $nestedMixins))
	@endforeach
    @forelse($projects as $project)
        <div class="row">
            <h3 class="col-sm-12">
                @if(Route::has('projects'))
                    <a href="{{route('projects', $project->id)}}" title="Show project {{$project->name}}">
                        {{$project->name}}
                    </a>
                @else
                    {{$project->name}}
                @endif
            </h3>
            @foreach($project->transects()->orderBy('created_at', 'desc')->take(3)->get() as $transect)
                <div class="col-xs-12 col-sm-6 col-md-3 dashboard__project-transect">
                    <figure class="image-thumbnail">
                        @if(Route::has('transect'))
                            <a href="{{ route('transect', $transect->id) }}">
                        @endif
                            <?php $image = $transect->images()->first() ?>
                            @if (File::exists($image->thumbPath))
                                <img src="{{ url('api/v1/images/'.$image->id.'/thumb') }}">
                            @else
                                <img src="{{ asset(config('thumbnails.empty_url')) }}">
                            @endif
                            <figcaption class="caption">
                                {{ $transect->name }}
                            </figcaption>
                        @if(Route::has('transect'))
                            </a>
                        @endif
                    </figure>
                </div>
            @endforeach
            @if($project->transects()->count() > 3 && Route::has('project'))
                <div class="col-xs-12 col-sm-6 col-md-3 dashboard__more-transects">
                    <a href="{{route('project', $project->id)}}" class="btn" title="Show all transects">
                        <span class="glyphicon glyphicon-option-horizontal" aria-hidden="true"></span>
                    </a>
                </div>
            @endif
        </div>
    @empty
        <div class="row">
            <div class="alert alert-info col-md-6 col-md-offset-3">
                You do not belong to any projects yet.
                @if(Route::has('projects-create'))
                    You can <a href="{{route('projects-create')}}">create your own project</a> or request a project admin to add you to a project.
                @else
                    You can request a project admin to add you to a project.
                @endif
            </div>
        </div>
    @endforelse
    @if(Route::has('projects-index'))
        <div class="row">
            <div class="col-xs-12">
                <a href="{{route('projects-index')}}" class="btn btn-default btn-lg dashboard__all-projects">Show all projects</a>
            </div>
        </div>
    @endif
</div>
@endsection
