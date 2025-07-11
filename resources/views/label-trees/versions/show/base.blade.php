@extends('app')

@section('title', "{$tree->name} @ {$version->name}")

@push('styles')
@mixin('labelTreesShowStyles')
@endpush

@push('scripts')
<script type="module">
    biigle.$declare('labelTrees.version', {{ Js::from($version) }});
    @can('destroy', $version)
        biigle.$declare('labelTrees.redirectUrl', '{{route('label-trees', $version->label_tree_id)}}');
    @endcan
</script>
@mixin('labelTreesShowScripts')
@endpush


@section('content')
<div class="container">
    @include('label-trees.versions.show.title')
    @include('label-trees.versions.show.tabs')
    @yield('label-tree-version-content')
</div>
@endsection
