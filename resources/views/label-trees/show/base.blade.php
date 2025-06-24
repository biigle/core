@extends('app')

@section('title', $tree->name)

@push('styles')
@mixin('labelTreesShowStyles')
@endpush

@push('scripts')
<script type="module">
    biigle.$declare('labelTrees.labelTree', {{Js::from($tree)}});
    biigle.$declare('labelTrees.privateVisibilityId', {!! \Biigle\Visibility::privateId() !!});
    biigle.$declare('labelTrees.userId', {!! $user->id !!});
    biigle.$declare('labelTrees.redirectUrl', '{{route('home')}}');
</script>
@mixin('labelTreesShowScripts')
@endpush


@section('content')
<div class="container">
    @include('label-trees.show.title')
    @include('label-trees.show.tabs')
    @yield('label-tree-content')
</div>
@endsection
