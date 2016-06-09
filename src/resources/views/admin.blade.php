@extends('admin.base')

@section('title')Global label trees @stop

@section('admin-content')
<h2>Global label trees</h2>
<div class="list-group">
    @forelse ($trees as $tree)
        <a class="list-group-item" href="{{route('label-trees', $tree->id)}}" title="Show the label tree {{$tree->name}}">
            <h4 class="list-group-item-heading">{{$tree->name}}</h4>
            @if($tree->description)
                <p class="list-group-item-text">{{$tree->description}}</p>
            @endif
        </a>
    @empty
        <p class="list-group-item list-group-item-info">
            There are no global label trees.
        </p>
    @endforelse
</div>
@endsection
