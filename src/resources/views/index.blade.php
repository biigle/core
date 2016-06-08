@extends('app')

@section('title'){{ $tree->name }}@stop

@push('styles')
<link href="{{ asset('vendor/label-trees/styles/main.css') }}" rel="stylesheet">
@endpush

@push('scripts')
<script src="{{ asset('vendor/label-trees/scripts/main.js') }}"></script>
<script type="text/javascript">
    angular.module('dias.label-trees').constant('LABEL_TREE_ID', {!! $tree->id !!});
    angular.module('dias.label-trees').constant('LABELS', {!! $labels !!});
    @if($private)
        @can('update', $tree)
            angular.module('dias.label-trees').constant('AUTH_PROJECTS', {!! $authorizedProjects !!});
            angular.module('dias.label-trees').constant('AUTH_OWN_PROJECTS', {!! $authorizedOwnProjects !!});
        @endcan
    @endif
</script>
@endpush


@section('content')
<div class="container" data-ng-app="dias.label-trees">
    <h2 class="col-md-12">@if($private) <small><span class="text-muted glyphicon glyphicon-lock" aria-hidden="true" title="This label tree is private"></span></small>@endif {{$tree->name}} @if($tree->description)<br><small>{{$tree->description}}</small>@endif </h2>
    <div class="col-md-6">
        @include('label-trees::index.labels')
    </div>
    <div class="col-md-6">
        @include('label-trees::index.projects')
        @if($private)
            @can('update', $tree)
                @include('label-trees::index.authorized-projects')
            @endcan
        @endif
    </div>
</div>
@endsection
