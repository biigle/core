@extends('app')

@section('title'){{ $volume->name }} @stop

@push('scripts')
    <script src="{{ cachebust_asset('vendor/label-trees/scripts/main.js') }}"></script>
    <script src="{{ cachebust_asset('vendor/volumes/scripts/main.js') }}"></script>
    <script src="{{ cachebust_asset('vendor/largo/scripts/main.js') }}"></script>
    <script type="text/javascript">
        biigle.$declare('largo.volumeId', {!! $volume->id !!});
        biigle.$declare('largo.labelTrees', {!! $labelTrees !!});
        biigle.$declare('largo.showAnnotationRoute', '@if(Route::has('show-annotation')){{ route('show-annotation', '') }}/' @else '' @endif);
    </script>
@endpush

@push('styles')
    <link href="{{ cachebust_asset('vendor/label-trees/styles/main.css') }}" rel="stylesheet">
    <link href="{{ cachebust_asset('vendor/volumes/styles/main.css') }}" rel="stylesheet">
    <link href="{{ cachebust_asset('vendor/largo/styles/main.css') }}" rel="stylesheet">
@endpush

@section('navbar')
<div class="navbar-text navbar-largo-breadcrumbs">
    @include('volumes::partials.projectsBreadcrumb') / <a href="{{route('volume', $volume->id)}}" title="Show volume {{$volume->name}}" class="navbar-link">{{$volume->name}}</a> / <span id="largo-title">Largo / <strong v-if="isInDismissStep">dismiss existing annotations</strong><strong v-cloak v-else>re-label dismissed annotations</strong> <small>(<span v-text="shownCount">0</span>&nbsp;annotations)</small></span> @include('volumes::partials.annotationSessionIndicator')
</div>
@endsection

@section('content')
<div id="largo-container" class="largo-container">
    @include('largo::show.content')
</div>
@endsection
