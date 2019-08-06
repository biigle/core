@extends('app')

@section('title', "Merge '{$mergeTree->versionedName}' into '{$baseTree->versionedName}'")

@push('styles')
<link href="{{ cachebust_asset('vendor/label-trees/styles/main.css') }}" rel="stylesheet">
@endpush

@push('scripts')
<script src="{{ cachebust_asset('vendor/label-trees/scripts/main.js') }}"></script>
<script type="text/javascript">
    biigle.$declare('labelTrees.baseTree', {!! $baseTree !!});
    biigle.$declare('labelTrees.mergeTree', {!! $mergeTree !!});
    biigle.$declare('labelTrees.usedLabels', {!! $usedLabels !!});
</script>
@endpush


@section('content')
<div class="container" id="merge-label-trees-container">
    <div class="row">
        <div class="col-md-12">
            <h2>Merge <a href="{{route('label-trees', $mergeTree->id)}}">{{$mergeTree->versionedName}}</a> into <a href="{{route('label-trees', $baseTree->id)}}">{{$baseTree->versionedName}}</a></h2>
            <label-tree-diff
                left-name="{{$baseTree->versionedName}}"
                v-bind:left-labels="baseTreeLabels"
                right-name="{{$mergeTree->versionedName}}"
                v-bind:right-labels="mergeTreeLabels"
                v-bind:used-labels="usedLabels"
                v-on:add="handleAdd"
                v-on:remove="handleRemove"
                v-on:cancel-add="handleCancelAdd"
                v-on:cancel-remove="handleCancelRemove"
                ></label-tree-diff>
            <div class="pull-right">
                <a href="{{route('label-trees', $baseTree->id)}}" class="btn btn-default" title="Back to {{$baseTree->versionedName}}">Cancel</a>
                <button class="btn btn-success" title="Merge the resolved differences into {{$baseTree->versionedName}}" v-on:click="submitMerge" v-bind:disabled="cannotMerge">Merge into {{$baseTree->versionedName}}</button>
            </div>
        </div>
    </div>
</div>
@endsection
