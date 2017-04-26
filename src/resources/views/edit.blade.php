@extends('app')
@inject('modules', 'Biigle\Services\Modules')

@section('title')Edit volume {{ $volume->name }} @stop

@push('scripts')
    <script src="{{ cachebust_asset('vendor/volumes/scripts/main.js') }}"></script>
    <script type="text/javascript">
        biigle.$declare('volumes.id', {!! $volume->id !!});
        biigle.$declare('volumes.annotationSessions', {!! $annotationSessions !!});
        biigle.$declare('volumes.images', {!! $images !!});
    </script>
    @foreach ($modules->getMixins('volumesEditScripts') as $module => $nestedMixins)
        @include($module.'::volumesEditScripts', ['mixins' => $nestedMixins])
    @endforeach
@endpush

@push('styles')
    <link href="{{ cachebust_asset('vendor/volumes/styles/edit.css') }}" rel="stylesheet">
    @foreach ($modules->getMixins('volumesEditStyles') as $module => $nestedMixins)
        @include($module.'::volumesEditStyles', ['mixins' => $nestedMixins])
    @endforeach
@endpush

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
    </div>
    <div class="col-sm-6">
        @include('volumes::edit.images')
        @include('volumes::edit.metadata')
    </div>
</div>

@endsection
