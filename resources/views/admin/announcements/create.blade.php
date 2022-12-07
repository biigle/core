@extends('admin.base')

@section('title', 'New announcement')

@section('admin-content')
<h4>Create a new announcement</h4>

<form id="announcements-edit-form" class="clearfix" role="form" method="POST" action="{{ url('api/v1/announcements') }}" onsubmit="return confirm('This will publish the announcement and notify all users. Continue?');">
    <div class="row">
        <div class="col-md-6 form-group{{ $errors->has('title') ? ' has-error' : '' }}" v-bind:class="titleClass">
            <label for="title">Title</label>
            <div class="input-group">
                <input type="text" class="form-control" name="title" v-model="title" required>
                <div class="input-group-addon" v-text="titleChars"></div>
            </div>
            @if($errors->has('title'))
                <span class="help-block">{{ $errors->first('title') }}</span>
            @else
                <span class="help-block">The title should not be longer than 30 characters.</span>
            @endif
        </div>
        <div class="col-md-6 form-group{{ $errors->has('show_until') ? ' has-error' : '' }}">
            <label>Show until</label>
            <div>
                <datepicker-dropdown v-model="showUntil" placeholder="{{now()->toDateString()}}" :limit-from="limitFrom"></datepicker-dropdown>
                <input ref="showUntilInput" type="hidden" name="show_until" v-bind:value="showUntil">
            </div>
            @if($errors->has('show_until'))
                <span class="help-block">{{ $errors->first('show_until') }}</span>
            @else
                <span class="help-block">The announcement will be shown until this date starts.</span>
            @endif
        </div>
    </div>
    <div class="row">
        <div class="col-md-6 form-group{{ $errors->has('body') ? ' has-error' : '' }}">
            <label for="body">Body</label>
            <textarea ref="bodyInput" name="body" class="form-control announcement__html-preview" rows="5" v-model="body">{{old('body')}}</textarea>
            @if($errors->has('body'))
                <span class="help-block">{{ $errors->first('body') }}</span>
            @else
                <span class="help-block">You can use HTML in the body and it should not be too long.</span>
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

@push('scripts')
<script type="text/javascript">
    biigle.$declare('announcement.title', '{!! old('title') !!}')
    biigle.$declare('announcement.showUntil', '{!! old('show_until') !!}')
    biigle.$declare('announcement.body', '{!! old('body') !!}')
</script>
@endpush
