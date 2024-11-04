@extends('app')

@section('title', "Merge a label tree into '{$tree->name}'")

@push('scripts')
<script type="module">
    biigle.$declare('labelTrees.mergeCandidates', {!! $mergeCandidates !!});
    biigle.$declare('labelTrees.mergeUrlTemplate', '{!! route('label-trees-merge', [$tree->id, ':id']) !!}');
</script>
@endpush


@section('content')
<div class="container" id="merge-label-trees-index-container">
     <div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
        <h2>Merge a label tree into <a href="{{route('label-trees', $tree->id)}}">{{$tree->name}}</a></h2>
        <p>
            Choose a label tree to merge.
        </p>
        <div class="form-group">
            <typeahead class="typeahead--block" :items="mergeCandidates" placeholder="Label tree name" v-on:select="chooseCandidate" more-info="description" title="Choose a label tree to merge"></typeahead>
        </div>
        <div class="pull-right">
            <a href="{{ route('label-trees', $tree->id) }}" class="btn btn-default">Cancel</a>
            <a v-bind:href="continueUrl" v-bind:disabled="cannotContinue" class="btn btn-success">Continue</a>
        </div>
    </div>
</div>
@endsection
