@extends('app')

@section('title', "Create new version of {$tree->name}")

@section('content')
<div class="container">
    <div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
        <h2>New version of {{$tree->name}}</h2>
        <form class="clearfix" role="form" method="POST" action="{{ url("api/v1/label-trees/{$tree->id}/versions") }}" onsubmit="this.submitButton.disabled = true;">
            <div class="form-group{{ $errors->has('name') ? ' has-error' : '' }}">
                <label for="name">Name</label>
                <input type="text" class="form-control" name="name" id="name" value="{{ old('name') }}" placeholder="v1.0" autofocus required>
                @if($errors->has('name'))
                    <span class="help-block">{{ $errors->first('name') }}</span>
                @else
                    <span class="help-block">A short version name like "v1.0".</span>
                @endif
            </div>

            <div class="form-group{{ $errors->has('description') ? ' has-error' : '' }}">
                <label for="description">Description</label>
                <input class="form-control" type="text" name="description" id="description" value="{{ old('description', $tree->description) }}">
                @if($errors->has('description'))
                    <span class="help-block">{{ $errors->first('description') }}</span>
                @endif
            </div>

            <div class="form-group{{ $errors->has('doi') ? ' has-error' : '' }}">
                <label for="doi">DOI</label>
                <input class="form-control" type="text" name="doi" id="doi" value="{{ old('doi') }}" placeholder="10.1000/xyz123">
                @if($errors->has('doi'))
                    <span class="help-block">{{ $errors->first('doi') }}</span>
                @endif
            </div>

            <input type="hidden" name="label_tree_id" value="{{ $tree->id }}">

            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <input type="submit" name="submitButton" class="btn btn-success pull-right" value="Create">
            <a href="{{ route('label-trees', $tree->id) }}" class="btn btn-link">Cancel</a>
        </form>
    </div>
</div>
@endsection
