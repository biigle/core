@extends('app')
@section('title', "Edit volume {$volume->name}")

@push('scripts')
    <script src="{{ cachebust_asset('vendor/volumes/scripts/main.js') }}"></script>
    <script type="text/javascript">
        biigle.$declare('volumes.id', {!! $volume->id !!});
        biigle.$declare('volumes.annotationSessions', {!! $annotationSessions !!});
        biigle.$declare('volumes.images', {!! $images !!});
    </script>
    @mixin('volumesEditScripts')
@endpush

@push('styles')
    <link href="{{ cachebust_asset('vendor/volumes/styles/main.css') }}" rel="stylesheet">
    @mixin('volumesEditStyles')
@endpush

@section('navbar')
<div class="navbar-text navbar-volumes-breadcrumbs">
    @include('volumes::partials.projectsBreadcrumb') / <strong>{{$volume->name}}</strong>
</div>
@endsection

@section('content')

<div class="container">
    <h2 class="col-xs-12 clearfix">
        Edit {{$volume->name}}
        <span class="pull-right">
            <a class="btn btn-default" href="{{route('volume', $volume->id)}}">Back</a>
        </span>
    </h2>
    <div class="col-sm-6">
        @include('volumes::edit.information')
        @include('volumes::edit.annotation-sessions')
        @mixin('volumesEditLeft')
    </div>
    <div class="col-sm-6">
        @include('volumes::edit.images')
        @include('volumes::edit.metadata')
        @mixin('volumesEditRight')
    </div>
</div>

@endsection
