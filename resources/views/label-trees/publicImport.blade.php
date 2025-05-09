@extends('app')

@section('title', 'Import a label tree')

@section('content')
<div class="container">
    <div class="col-sm-6 col-sm-offset-3 col-lg-4 col-lg-offset-4">
        <h2>Import a label tree</h2>
        <form role="form" method="POST" action="{{ url('api/v1/label-trees/import') }}" enctype="multipart/form-data">
            <div class="form-group{{ $errors->has('archive') ? ' has-error' : '' }}">
                <label>Select an import archive</label>
                <input type="file" name="archive" required>
                @if ($errors->has('archive'))
                   <span class="help-block">{{ $errors->first('archive') }}</span>
                @endif
                <span class="help-block">You can find a description of the import archive format in the <a href="{{route('manual-tutorials', ['label-trees', 'download-import'])}}">manual</a>.</span>
            </div>
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <button type="submit" class="btn btn-success pull-right">Import</button>
            <a href="{{ URL::previous() }}" class="btn btn-link">Cancel</a>
        </form>
    </div>
</div>
@endsection
