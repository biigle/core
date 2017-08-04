@extends('app')

@section('title') Label trees @stop

@section('content')
<div class="container">
    <div class="col-md-offset-3 col-md-6">
        <div class="row">
            <div class="col-sm-6">
                <form class="form" action="{{route('search')}}" method="GET">
                    <div class="form-group">
                        <div class="input-group">
                            <input type="text" name="q" class="form-control" placeholder="Find label tree">
                            <input type="hidden" name="t" value="label-trees">
                            <span class="input-group-btn">
                                <button class="btn btn-default" type="submit" title="Find"><span class="glyphicon glyphicon-search" aria-hidden="true"></span></button>
                            </span>
                        </div>
                    </div>
                </form>
            </div>
            <div class="col-sm-6 clearfix">
                <a class="btn btn-default pull-right" href="{{route('label-trees-create')}}">New label tree</a>
            </div>
        </div>
        @if ($trees->total() > 0)
            <p>
                Results {{$trees->firstItem()}} to {{$trees->lastItem()}} of {{$trees->total()}}
            </p>
        @endif
        <div class="list-group">
            @forelse($trees as $tree)
                <a class="list-group-item @if($newTree && $tree->id === $newTree->id) list-group-item-success @endif" href="{{route('label-trees', $tree->id)}}" title="Show the label tree {{$tree->name}}">
                    <h4 class="list-group-item-heading">
                        @if ($tree->visibility_id === Biigle\Visibility::$private->id)
                            <small class="text-muted glyphicon glyphicon-lock" aria-hidden="true" title="This label tree is private"></small>
                        @endif
                        {{$tree->name}}
                    </h4>
                    @if($tree->description)
                        <p class="list-group-item-text">{{$tree->description}}</p>
                    @endif
                </a>
            @empty
                <p class="list-group-item list-group-item-info">
                    There are no label trees for you.
                </p>
            @endforelse
        </div>
        @if ($trees->total() > 0)
            <nav>
                <ul class="pager">
                    @if ($trees->currentPage() > 1)
                        <li><a href="{{$trees->previousPageUrl()}}">Previous</a></li>
                    @else
                        <li class="disabled"><a href="#" disabled>Previous</a></li>
                    @endif

                    @if ($trees->hasMorePages())
                        <li><a href="{{$trees->nextPageUrl()}}">Next</a></li>
                    @else
                        <li class="disabled"><a href="#" disabled>Next</a></li>
                    @endif
                </ul>
            </nav>
        @endif
    </div>
</div>
@endsection
