@extends('app')
@inject('modules', 'Dias\Services\Modules')

@section('title')Edit transect {{ $transect->name }} @stop

@push('scripts')
    <script src="{{ asset('vendor/transects/scripts/edit.js') }}"></script>
    <script type="text/javascript">
        angular.module('dias.transects.edit').constant('TRANSECT_ID', {!!$transect->id!!});
    </script>
    @foreach ($modules->getMixins('transectsEditScripts') as $module => $nestedMixins)
        @include($module.'::transectsEditScripts', ['mixins' => $nestedMixins])
    @endforeach
@endpush

@push('styles')
    <link href="{{ asset('vendor/transects/styles/edit.css') }}" rel="stylesheet">
    @foreach ($modules->getMixins('transectsEditStyles') as $module => $nestedMixins)
        @include($module.'::transectsEditStyles', ['mixins' => $nestedMixins])
    @endforeach
@endpush

@section('content')

<div class="container" data-ng-app="dias.transects.edit">
    <h2 class="col-xs-12">Edit {{$transect->name}}</h2>
    <div class="col-sm-6">
        <div class="panel panel-default">
            <div class="panel-heading">
                <h3 class="panel-title">Transect information</h3>
            </div>
            <div class="panel-body">
                @if (session('saved'))
                    <div class="alert alert-success" role="alert">
                        The transect information was successfully updated.
                    </div>
                @endif
                <form role="form" method="POST" action="{{ url('api/v1/transects/'.$transect->id) }}">
                    <div class="row">
                        <div class="form-group col-sm-6{{ $errors->has('name') ? ' has-error' : '' }}">
                            <label for="name">Name</label>
                            <input type="text" class="form-control" name="name" id="name" value="{{ old('name', $transect->name) }}" required>
                            @if($errors->has('name'))
                                <span class="help-block">{{ $errors->first('name') }}</span>
                            @endif
                        </div>
                        <div class="form-group col-sm-6{{ $errors->has('media_type_id') ? ' has-error' : '' }}">
                            <label for="media_type_id">Media type</label>
                            <select class="form-control" name="media_type_id" id="media_type_id" required>
                                @foreach($mediaTypes as $mediaType)
                                    <option {!! old('media_type_id', $transect->media_type_id) == $mediaType->id ? 'selected="selected"' : '' !!} value="{{ $mediaType->id }}">{{ trans('dias.media_types.'.$mediaType->name) }}</option>
                                @endforeach
                            </select>
                            @if($errors->has('media_type_id'))
                                <span class="help-block">{{ $errors->first('media_type_id') }}</span>
                            @endif
                        </div>
                    </div>
                    <div class="row">
                        <div class="form-group col-xs-12{{ $errors->has('url') ? ' has-error' : '' }}">
                            <label for="url">URL</label>
                            <input type="text" class="form-control" name="url" id="url" value="{{ old('url', $transect->url) }}" required>
                            <p class="help-block">
                                The directory containing the transect images. Can be local like <code>/vol/images/transect</code> or remote like <code>https://my-domain.tld/transect</code>.
                            </p>
                            @if($errors->has('url'))
                                <span class="help-block">{{ $errors->first('url') }}</span>
                            @endif
                        </div>
                    </div>
                    <input type="hidden" name="_token" value="{{ csrf_token() }}">
                    <input type="hidden" name="_method" value="PUT">
                    <input type="hidden" name="_redirect" value="{{ route('transect-edit', $transect->id) }}">
                    <input type="submit" class="btn btn-success" value="Save">
                </form>
            </div>
        </div>
    </div>
    <div class="col-sm-6">
        <div class="panel panel-default transect-images-panel" data-ng-controller="ImagesController" data-confirmation="Do you really want to delete the image :img? All annotations will be lost!" data-success="The image was deleted." data-ng-class="{'panel-warning': data.addingNewImages}">
            <div class="panel-heading">
                <h3 class="panel-title">
                    Transect images
                    <span class="pull-right">
                        {{-- put image filter toggle here --}}
                        <button class="btn btn-default btn-xs" title="Add new images" data-ng-click="toggleAddingNewImage()" data-ng-class="{active: data.addingNewImages}"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></button>
                    </span>
                </h3>
            </div>
            <div class="panel-body ng-cloak" data-ng-if="data.addingNewImages">
                <form role="form" class="form-inline" data-ng-submit="addNewImages()">
                    <div class="form-group">
                        <input type="text" class="form-control" name="filename" id="images" placeholder="New image filename(s)" data-ng-model="data.filenames" required>
                    </div>
                    <button type="submit" class="btn btn-success">Add image(s)</button>
                    <span class="help-block">Mutliple images may be added by submitting the image filenames as comma separated values. Example: <code>1.jpg, 2.jpg, 3.jpg</code>.</span>
                </form>
            </div>
            <ul class="list-group images-list">
                <li data-ng-repeat="image in data.newImages track by image.id" class="ng-cloak list-group-item list-group-item-success">
                    <span class="text-muted">#@{{image.id}}</span> @{{image.filename}} <button type="button" class="close" title="Delete image #@{{image.id}} (@{{image.filename}})" data-ng-click="deleteImage(image.id, image.filename)"><span aria-hidden="true">&times;</span></button>
                </li>
                @foreach ($images as $id => $filename)
                    <li id="transect-image-{{$id}}" class="list-group-item">
                        <span class="text-muted">#{{$id}}</span> {{$filename}} <button type="button" class="close" title="Delete image #{{$id}} ({{$filename}})" data-ng-click="deleteImage({{$id}}, '{{$filename}}')"><span aria-hidden="true">&times;</span></button>
                    </li>
                @endforeach
            </ul>
        </div>
    </div>
</div>

@endsection
