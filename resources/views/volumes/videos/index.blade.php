@extends('app')
@section('title', $video->filename)

@section('content')
<div class="container">
    <div class="row">
        <h2 class="col-lg-12 clearfix file-info-title" title="{{ $video->filename }}">
            {{ $video->filename }}
            <span class="pull-right">
                <a href="{{route('volume', $volume->id)}}" title="Back to {{ $volume->name }}" class="btn btn-default">back</a>
                @mixin('imagesIndexButtons')
            </span>
        </h2>
    </div>
    <div class="row">
        <div class="col-sm-6 col-lg-4">
            <div class="panel panel-default panel-image">
                <img src="{{ $video->thumbnail_url }}" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'" @if($video->height < $video->width) class="prevent-overflow" @endif>
            </div>
            @include('volumes.videos.index.meta')
        </div>
    </div>
</div>
@endsection

@section('navbar')
<div class="navbar-text navbar-volumes-breadcrumbs">
    @include('volumes.partials.projectsBreadcrumb', ['projects' => $volume->projects]) /
    <a href="{{route('volume', $volume->id)}}" class="navbar-link" title="Show volume {{$volume->name}}">{{$volume->name}}</a> /
    <strong title="{{$video->filename}}">{{$video->filename}}</strong>
    @include('volumes.partials.annotationSessionIndicator')
</div>
@endsection
