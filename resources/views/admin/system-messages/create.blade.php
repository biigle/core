@extends('admin.base')

@section('title', 'System messages admin area - New system message')

@section('admin-content')
<h4>Create a new system message</h4>

<form id="system-messages-edit-form" class="clearfix" role="form" method="POST" action="{{ url('api/v1/system-messages') }}">
    <div class="row">
        <div class="col-md-6 form-group{{ $errors->has('title') ? ' has-error' : '' }}">
            <label for="title">Title</label>
            <input type="text" class="form-control" name="title" id="title" value="{{ old('title') }}" required>
            @if($errors->has('title'))
                <span class="help-block">{{ $errors->first('title') }}</span>
            @endif
        </div>
        <div class="col-md-6 form-group{{ $errors->has('type_id') ? ' has-error' : '' }}">
            <label for="type_id">Type</label>
            <select class="form-control" name="type_id" id="type_id" required>
                @foreach ($types as $type)
                    <option value="{{$type->id}}" @selected(old('type_id') === $type->id)>{{$type->name}}</option>
                @endforeach
            </select>
            @if($errors->has('type_id'))
                <span class="help-block">{{ $errors->first('type_id') }}</span>
            @endif
        </div>
    </div>
    <div class="row">
        <div class="col-md-6 form-group{{ $errors->has('body') ? ' has-error' : '' }}">
            <label for="body">Body</label>
            <textarea name="body" class="form-control system-message__html-preview" rows="15" v-model="body">{{old('body')}}</textarea>
            @if($errors->has('body'))
                <span class="help-block">{{ $errors->first('body') }}</span>
            @endif
        </div>
        <div class="col-md-6">
            <label>Preview</label>
            <div class="well well-sm system-message__html-preview" v-html="body" v-if="body" v-cloak></div>
        </div>
    </div>
    <input type="hidden" name="_token" value="{{ csrf_token() }}">

    <a href="{{ route('admin-system-messages') }}" class="btn btn-default">Cancel</a>
    <span class="pull-right">
        <input type="submit" class="btn btn-success" title="Publish system message" value="Publish" formaction="{{ url('api/v1/system-messages') }}?publish=1" onclick="return confirm('This will publish the system message right away and notify all users. Published system messages cannot be deleted. Proceed?')">
        <input type="submit" class="btn btn-default" value="Save draft" title="Save draft">
    </span>
</form>
@endsection
