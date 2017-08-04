@extends('app')

@section('title') Projects @stop

@section('content')
<div class="container">
    <div class="col-md-offset-3 col-md-6">
        <div class="row">
            <div class="col-sm-6">
                <form class="form" action="{{route('search')}}" method="GET">
                    <div class="form-group">
                        <div class="input-group">
                            <input type="text" name="q" class="form-control" placeholder="Find project" value="{{old('query')}}">
                            <input type="hidden" name="t" value="projects">
                            <span class="input-group-btn">
                                <button class="btn btn-default" type="submit" title="Find"><span class="glyphicon glyphicon-search" aria-hidden="true"></span></button>
                            </span>
                        </div>
                    </div>
                </form>
            </div>
            <div class="col-sm-6 clearfix">
                <a class="btn btn-default pull-right" href="{{route('projects-create')}}">New project</a>
            </div>
        </div>
        @if ($projects->total() > 0)
            <p>
                Results {{$projects->firstItem()}} to {{$projects->lastItem()}} of {{$projects->total()}}
            </p>
        @endif
        <div class="list-group">
            @forelse($projects as $project)
                <a class="list-group-item container-fluid @if($newProject && $project->id === $newProject->id) list-group-item-success @endif" href="{{route('project', $project->id)}}" title="Show the project {{$project->name}}">
                    <div class="row">
                        @if ($project->thumbnail)
                            <div class="col-xs-2 project-thumbnail">
                                <img src="{{ asset(config('thumbnails.uri').'/'.$project->thumbnail->uuid.'.'.config('thumbnails.format')) }}" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
                            </div>
                            <div class="col-xs-10">
                        @else
                            <div class="col-xs-12">
                        @endif
                            <h4 class="list-group-item-heading">
                                {{$project->name}}
                            </h4>
                            @if($project->description)
                                <p class="list-group-item-text">{{$project->description}}</p>
                            @endif
                        </div>
                    </div>
                </a>
            @empty
                <p class="list-group-item list-group-item-info">
                    There are no projects for you.
                </p>
            @endforelse
        </div>
        @if ($projects->total() > 0)
            <nav>
                <ul class="pager">
                    @if ($projects->currentPage() > 1)
                        <li><a href="{{$projects->previousPageUrl()}}">Previous</a></li>
                    @else
                        <li class="disabled"><a href="#" disabled>Previous</a></li>
                    @endif

                    @if ($projects->hasMorePages())
                        <li><a href="{{$projects->nextPageUrl()}}">Next</a></li>
                    @else
                        <li class="disabled"><a href="#" disabled>Next</a></li>
                    @endif
                </ul>
            </nav>
        @endif
    </div>
</div>
@endsection

@push('styles')
<link href="{{ cachebust_asset('vendor/projects/styles/main.css') }}" rel="stylesheet">
@endpush
