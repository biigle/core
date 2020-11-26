@extends('label-trees.versions.show.base')

@section('label-tree-version-content')
<div class="row">
    <div class="col-md-6">
        @include('label-trees.show.labels')
    </div>
    <div class="col-md-6">
        @include('label-trees.show.projects')
    </div>
</div>
@endsection
