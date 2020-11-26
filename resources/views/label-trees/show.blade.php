@extends('label-trees.show.base')

@section('label-tree-content')
<div class="row">
    <div class="col-md-6">
        @include('label-trees.show.labels')
    </div>
    <div class="col-md-6">
        @include('label-trees.show.projects')
        @can('update', $tree)
            @include('label-trees.show.authorized-projects')
            @include('label-trees.show.members')
        @endcan
    </div>
</div>
@endsection
