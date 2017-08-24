@extends('app')
@inject('modules', 'Biigle\Services\Modules')

@section('title', $image->filename)

@push('styles')
    <link href="{{ cachebust_asset('vendor/volumes/styles/main.css') }}" rel="stylesheet">
@endpush

@section('content')
<div class="container">
    <div class="row">
        <h2 class="col-lg-12 clearfix">
            {{ $image->filename }}
            <span class="pull-right">
                <a href="{{route('volume', $volume->id)}}" title="Back to {{ $volume->name }}" class="btn btn-default">back</a>
                @foreach ($modules->getMixins('imagesIndexButtons') as $module => $nestedMixins)
                    @include($module.'::imagesIndexButtons', array('mixins' => $nestedMixins))
                @endforeach
            </span>
        </h2>
    </div>
    <div class="row">
        <div class="col-sm-6 col-lg-4">
            <div class="panel panel-default panel-image">
                <img src="{{asset(config('thumbnails.uri'))}}/{{$image->uuid}}.{{config('thumbnails.format')}}">
            </div>
            @include('volumes::images.index.meta')
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
<div class="navbar-text navbar-volumes-breadcrumbs">
    @include('volumes::partials.projectsBreadcrumb', ['projects' => $volume->projects])/ <a href="{{route('volume', $volume->id)}}" class="navbar-link" title="Show volume {{$volume->name}}">{{$volume->name}}</a>
    / <strong title="{{$image->filename}}">{{$image->filename}}</strong> @include('volumes::partials.annotationSessionIndicator')
</div>
@endsection
