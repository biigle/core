@extends('app')
@inject('modules', 'Dias\Services\Modules')

@section('title') Image {{ $image->id }}@stop

@section('content')
<div class="container">
    <h2 class="col-lg-12 clearfix">
        Image <small title="Image ID {{ $image->id }}">#{{ $image->id }}</small>
        <span class="pull-right">
            @foreach ($modules->getMixins('imagesIndexButtons') as $module => $nestedMixins)
                @include($module.'::imagesIndexButtons', array('mixins' => $nestedMixins))
            @endforeach
        </span>
    </h2>
    <div class="col-sm-6 col-lg-4">
        <img class="img-responsive img-thumbnail" src="{{ url('api/v1/images/'.$image->id.'/file') }}">
    </div>

    @include('transects::images.index.meta')

    @include('transects::images.index.exif')

    @foreach ($modules->getMixins('imagesIndex') as $module => $nestedMixins)
        @include($module.'::imagesIndex', array('mixins' => $nestedMixins))
    @endforeach
</div>
@endsection
