@extends('app')

@section('title', "{$tree->name} @ {$version->name}")

@push('styles')
<link href="{{ cachebust_asset('vendor/label-trees/styles/main.css') }}" rel="stylesheet">
@mixin('labelTreesShowStyles')
@endpush

@push('scripts')
<script src="{{ cachebust_asset('vendor/label-trees/scripts/main.js') }}"></script>
<script type="text/javascript">
    biigle.$declare('labelTrees.version', {!! $version !!});
    biigle.$declare('labelTrees.labels', {!! $labels !!});
    @can('destroy', $version)
        biigle.$declare('labelTrees.redirectUrl', '{{route('label-trees', $version->label_tree_id)}}');
    @endcan
</script>
@mixin('labelTreesShowScripts')
@endpush


@section('content')
<div class="container">
    @include('label-trees::versions.show.title')
    @include('label-trees::versions.show.toolbar')
    <div class="col-md-6">
        @include('label-trees::show.labels')
    </div>
    <div class="col-md-6">
        @include('label-trees::show.projects')
    </div>
</div>
@endsection
