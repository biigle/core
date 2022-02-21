@extends('admin.base')

@section('title', 'System messages admin area - Edit system message')

@section('admin-content')
<h4>
    Edit {{$message->title}}
    @if ($message->isPublished())
        <span class="pull-right label label-default">
            Published on {{$message->published_at}}
        </span>
    @else
        <form class="pull-right form-inline" ole="form" method="POST" action="{{ url('api/v1/system-messages') }}/{{$message->id}}" onsubmit="return confirm('Are you sure you want to delete the draft of the system message \'{{$message->title}}\'?')">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <input type="hidden" name="_method" value="DELETE">
            <input type="submit" class="btn btn-default btn-sm" value="Delete draft" title="Delete draft">
        </form>
    @endif
</h4>

<form id="system-messages-edit-form" class="clearfix" role="form" method="POST" action="{{ url('api/v1/system-messages') }}/{{$message->id}}">
    <div class="row">
        <div class="col-md-6 form-group{{ $errors->has('title') ? ' has-error' : '' }}">
            <label for="title">Title</label>
            <input type="text" class="form-control" name="title" id="title" value="{{ old('title') ?: $message->title }}" required>
            @if($errors->has('title'))
                <span class="help-block">{{ $errors->first('title') }}</span>
            @endif
        </div>
        <div class="col-md-6 form-group{{ $errors->has('type_id') ? ' has-error' : '' }}">
            <label for="type_id">Type</label>
            <select class="form-control" name="type_id" id="type_id" required>
                @foreach ($types as $type)
                    <option value="{{$type->id}}" @selected((old('type_id') ?: $message->type_id) === $type->id)>{{$type->name}}</option>
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
            <textarea name="body" class="form-control system-message__html-preview" rows="15" v-model="body">{{old('body') ?: $message->body}}</textarea>
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
    <input type="hidden" name="_method" value="PUT">

    <a href="{{ route('admin-system-messages') }}" class="btn btn-default">Back</a>
    <span class="pull-right">
        @if ($message->isPublished())
            <input type="submit" class="btn btn-success" value="Save update" title="Save update">
        @else
            <input type="submit" class="btn btn-success" value="Publish" title="Publish system message" formaction="{{ url('api/v1/system-messages') }}/{{$message->id}}?publish=1" onclick="return confirm('This will publish the system message and notify all users. Published system messages cannot be deleted. Proceed?')">
            <input type="submit" class="btn btn-default" value="Save draft" title="Save draft">
        @endif
    </span>
</form>
@endsection
