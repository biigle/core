@extends('app')

@section('title', 'Upload new video')

@section('content')
<div class="upload-form">
    <form class="well" action="{{url('api/v1/videos')}}" method="POST" enctype='multipart/form-data'>
        <legend>Upload a new video</legend>
        <div class="form-group{{ $errors->has('name') ? ' has-error' : '' }}">
            <input type="text" class="form-control" placeholder="Video name" name="name" value="{{ old('name') }}" autofocus required>
            @if($errors->has('name'))
                <span class="help-block">{{ $errors->first('name') }}</span>
            @endif
        </div>
        <div class="form-group{{ $errors->has('file') ? ' has-error' : '' }}">
            <input type="file" name="file" required>
            @if($errors->has('file'))
                <span class="help-block">{{ $errors->first('file') }}</span>
            @endif
        </div>
        @csrf
        <button type="submit" class="btn btn-success btn-block">Submit</button>
    </form>
</div>
@endsection
