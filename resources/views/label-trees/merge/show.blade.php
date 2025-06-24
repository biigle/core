@extends('app')

@section('title', "Merge '{$mergeTree->versionedName}' into '{$baseTree->versionedName}'")

@push('scripts')
<script type="module">
    biigle.$declare('labelTrees.baseTree', {{Js::from($baseTree)}});
    biigle.$declare('labelTrees.mergeTree', {{Js::from($mergeTree)}});
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
                v-bind:disabled="disableDiff"
                v-on:add="handleAdd"
                v-on:remove="handleRemove"
                v-on:cancel-add="handleCancelAdd"
                v-on:cancel-remove="handleCancelRemove"
                ></label-tree-diff>
            <p class="pull-right">
                <a href="{{route('label-trees', $baseTree->id)}}" class="btn btn-default" title="Back to {{$baseTree->versionedName}}">Back</a>
                <button class="btn btn-success" title="Merge the resolved differences into {{$baseTree->versionedName}}" v-on:click="submitMerge" v-bind:disabled="cannotMerge || null">
                    <span v-cloak v-if="merged">
                        Merge successful!
                    </span>
                    <span v-else>
                        Merge into {{$baseTree->versionedName}}
                    </span>
                </button>
            </p>
        </div>
    </div>
</div>
@endsection
