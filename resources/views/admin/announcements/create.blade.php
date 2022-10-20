@extends('admin.base')

@section('title', 'New announcement')

@section('admin-content')
<h4>Create a new announcement</h4>

<form id="announcements-edit-form" class="clearfix" role="form" method="POST" action="{{ url('api/v1/announcements') }}" onsubmit="return confirm('This will publish the announcement and notify all users. Continue?');">
    <div class="row">
        <div class="col-md-6 form-group{{ $errors->has('title') ? ' has-error' : '' }}">
            <label for="title">Title</label>
            <input type="text" class="form-control" name="title" id="title" value="{{ old('title') }}" required>
            @if($errors->has('title'))
                <span class="help-block">{{ $errors->first('title') }}</span>
            @endif
        </div>
        <div class="col-md-6">
            TODO Date Picker show_until
        </div>
    </div>
    <div class="row">
        <div class="col-md-6 form-group{{ $errors->has('body') ? ' has-error' : '' }}">
            <label for="body">Body</label>
            <textarea rel="bodyInput" name="body" class="form-control announcement__html-preview" rows="5" v-model="body">{{old('body')}}</textarea>
            @if($errors->has('body'))
                <span class="help-block">{{ $errors->first('body') }}</span>
            @endif
        </div>
        <div class="col-md-6">
            <label>Preview</label>
            <div class="well well-sm announcement__html-preview" v-html="body" v-if="body" v-cloak></div>
        </div>
    </div>
    <input type="hidden" name="_token" value="{{ csrf_token() }}">

    <a href="{{ route('admin-announcements') }}" class="btn btn-default">Cancel</a>
    <span class="pull-right">
        <input type="submit" class="btn btn-default" value="Publish announcement">
    </span>
</form>
@endsection
