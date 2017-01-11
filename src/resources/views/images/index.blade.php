@extends('app')
@inject('modules', 'Biigle\Services\Modules')

@section('title'){{ $image->filename }}@stop

@push('styles')
    <link href="{{ cachebust_asset('vendor/transects/styles/main.css') }}" rel="stylesheet">
@endpush

@section('content')
<div class="container">
    <div class="row">
        <h2 class="col-lg-12 clearfix">
            {{ $image->filename }}
            <span class="pull-right">
                <a href="{{route('transect', $transect->id)}}" title="Back to {{ $transect->name }}" class="btn btn-default">back</a>
                @foreach ($modules->getMixins('imagesIndexButtons') as $module => $nestedMixins)
                    @include($module.'::imagesIndexButtons', array('mixins' => $nestedMixins))
                @endforeach
            </span>
        </h2>
    </div>
    <div class="row">
        <div class="col-sm-6 col-lg-4">
            <div class="panel panel-default">
                <img class="img-responsive" src="{{ url('api/v1/images/'.$image->id.'/file') }}">
            </div>
            @include('transects::images.index.meta')
        </div>
        <div class="col-sm-6 col-lg-8">
            <div class="row">
                @foreach ($modules->getMixins('imagesIndex') as $module => $nestedMixins)
                    @include($module.'::imagesIndex', array('mixins' => $nestedMixins))
                @endforeach
            </div>
        </div>
    </div>
</div>
@endsection

@section('navbar')
<div class="navbar-text navbar-transects-breadcrumbs">
    @include('transects::partials.projectsBreadcrumb', ['projects' => $transect->projects])/ <a href="{{route('transect', $transect->id)}}" class="navbar-link" title="Show transect {{$transect->name}}">{{$transect->name}}</a>
    / <strong title="{{$image->filename}}">{{$image->filename}}</strong> @include('transects::partials.annotationSessionIndicator')
</div>
@endsection
