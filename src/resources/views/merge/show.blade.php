@extends('app')

@section('title', "Merge '{$mergeTree->name}' into '{$baseTree->name}'")

@push('styles')
<link href="{{ cachebust_asset('vendor/label-trees/styles/main.css') }}" rel="stylesheet">
@endpush

@push('scripts')
<script src="{{ cachebust_asset('vendor/label-trees/scripts/main.js') }}"></script>
<script type="text/javascript">
    biigle.$declare('labelTrees.baseTree', {!! $baseTree !!});
    biigle.$declare('labelTrees.mergeTree', {!! $mergeTree !!});
</script>
@endpush


@section('content')
<div class="container">
    <div class="row">
        <div class="col-md-12">
            <h2>Merge <a href="{{route('label-trees', $mergeTree->id)}}">{{$mergeTree->versionedName}}</a> into <a href="{{route('label-trees', $baseTree->id)}}">{{$baseTree->versionedName}}</a></h2>
        </div>
    </div>
    <div class="row">
        <div class="col-md-12" id="merge-label-trees-container">
            <label-tree-diff
                left-name="{{$baseTree->versionedName}}"
                v-bind:left-labels="baseTreeLabels"
                right-name="{{$mergeTree->versionedName}}"
                v-bind:right-labels="mergeTreeLabels"
                ></label-tree-diff>
        </div>
    </div>
    {{-- @include('label-trees::show.title')
    @include('label-trees::show.toolbar')
    <div class="col-md-6">
        @include('label-trees::show.labels')
    </div>
    <div class="col-md-6">
        @include('label-trees::show.projects')
        @can('update', $tree)
            @include('label-trees::show.authorized-projects')
            @include('label-trees::show.members')
        @endcan
    </div> --}}
</div>
@endsection
