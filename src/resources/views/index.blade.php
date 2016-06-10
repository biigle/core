@extends('app')

@section('title') Projects @stop

@section('content')
<div class="container">
    <div class="col-md-offset-3 col-md-6">
        <div class="row">
            <div class="col-sm-6">
                <form class="form" action="{{route('projects-index')}}" method="GET">
                    <div class="form-group">
                        <div class="input-group">
                            <input type="text" name="query" class="form-control" placeholder="Find project" value="{{old('query')}}">
                            <span class="input-group-btn">
                                <a class="btn btn-default" href="{{route('projects-index')}}" title="Clear"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a>
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
                <a class="list-group-item @if($newProject && $project->id === $newProject->id) list-group-item-success @endif" href="{{route('project', $project->id)}}" title="Show the project {{$project->name}}">
                    <h4 class="list-group-item-heading">
                        {{$project->name}}
                    </h4>
                    @if($project->description)
                        <p class="list-group-item-text">{{$project->description}}</p>
                    @endif
                </a>
            @empty
                <p class="list-group-item list-group-item-info">
                    @if (old('query'))
                        There are no projects matching your query <strong>{{old('query')}}</strong>.
                    @else
                        There are no projects.
                    @endif
                </p>
            @endforelse
        </div>
        @if ($projects->total() > 0)
            <nav>
                <ul class="pager">
                    @if ($projects->currentPage() > 1)
                        <li><a href="{{$projects->previousPageUrl()}}@if(old('query'))&query={{old('query')}}@endif">Previous</a></li>
                    @else
                        <li class="disabled"><a href="#" disabled>Previous</a></li>
                    @endif

                    @if ($projects->hasMorePages())
                        <li><a href="{{$projects->nextPageUrl()}}@if(old('query'))&query={{old('query')}}@endif">Next</a></li>
                    @else
                        <li class="disabled"><a href="#" disabled>Next</a></li>
                    @endif
                </ul>
            </nav>
        @endif
    </div>
</div>
@endsection
