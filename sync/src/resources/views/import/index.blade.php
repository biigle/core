@extends('admin.base')

@section('title', 'Import')

@push('styles')
<link href="{{ cachebust_asset('vendor/sync/styles/main.css') }}" rel="stylesheet">
@endpush

@section('admin-content')
<h2>Import</h2>
<form class="import-upload-form" method="post" action="{{url('api/v1/import')}}" enctype="multipart/form-data">
    <div class="form-group{{ $errors->has('archive') ? ' has-error' : '' }}">
        <label>Select an import archive</label>
        <input type="file" name="archive" required>
        @if ($errors->has('archive'))
           <span class="help-block">{{ $errors->first('archive') }}</span>
        @endif
    </div>
    <input type="hidden" name="_token" value="{{ csrf_token() }}">
    <button type="submit" class="btn btn-success btn-block">Upload</button>
</form>
@endsection
