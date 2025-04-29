@extends('app')
@section('title', $image->filename)

@section('content')
<div class="container">
    <div class="row">
        <h2 class="col-lg-12 clearfix file-info-title" title="{{ $image->filename }}">
            {{ $image->filename }}
            <span class="pull-right">
                <a href="{{route('volume', $volume->id)}}" title="Back to {{ $volume->name }}" class="btn btn-default">back</a>
                @mixin('imagesIndexButtons')
            </span>
        </h2>
    </div>
    <div class="row">
        <div class="col-sm-6 col-lg-4">
            <div class="panel panel-default panel-image">
                <img src="{{ thumbnail_url($image->uuid) }}" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'" class="prevent-overflow">
            </div>
            @include('volumes.images.index.meta')
        </div>
        <div class="col-sm-6 col-lg-8">
            <div class="row">
                @mixin('imagesIndex')
            </div>
        </div>
    </div>
</div>
@endsection

@section('navbar')
<div class="navbar-text navbar-volumes-breadcrumbs">
    <div class="annotations-project-dd">
        @include('volumes.partials.projectsBreadcrumb', ['projects' => $volume->projects]) /
    </div>
    <div class="annotations-breadcrumb">
        <a href="{{route('volume', $volume->id)}}" class="navbar-link" title="Show volume {{$volume->name}}">{{$volume->name}}</a> /
        <strong title="{{$image->filename}}">{{$image->filename}}</strong>
    </div>
    @include('volumes.partials.annotationSessionIndicator')
</div>
@endsection
