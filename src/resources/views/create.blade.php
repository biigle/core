@extends('app')

@section('title') Create new label tree @stop

@section('content')
<div class="container">
    <div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
        <h2>New label tree</h2>
        <form class="clearfix" role="form" method="POST" action="{{ url('api/v1/label-trees') }}">
            <div class="form-group{{ $errors->has('name') ? ' has-error' : '' }}">
                <label for="name">Name</label>
                <input type="text" class="form-control" name="name" id="name" value="{{ old('name') }}">
                @if($errors->has('name'))
                    <span class="help-block">{{ $errors->first('name') }}</span>
                @endif
            </div>

            <div class="form-group{{ $errors->has('visibility_id') ? ' has-error' : '' }}">
                <label for="visibility_id">Visibility</label>
                <select class="form-control" name="visibility_id">
                    @foreach($visibilities as $visibility)
                        <option value="{{$visibility->id}}" @if((int) old('visibility_id') === $visibility->id) selected="" @endif>{{$visibility->name}}</option>
                    @endforeach
                </select>
                @if($errors->has('visibility_id'))
                    <span class="help-block">{{ $errors->first('visibility_id') }}</span>
                @endif
            </div>

            <div class="form-group{{ $errors->has('description') ? ' has-error' : '' }}">
                <label for="description">Description (optional)</label>
                <input class="form-control" type="text" name="description" id="description" value="{{ old('description') }}">
                @if($errors->has('description'))
                    <span class="help-block">{{ $errors->first('description') }}</span>
                @endif
            </div>
            <input type="hidden" name="_redirect" value="{{route('label-trees-index')}}">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <a href="{{ URL::previous() }}" class="btn btn-link">Cancel</a>
            <input type="submit" class="btn btn-success pull-right" value="Create">
        </form>
    </div>
</div>
@endsection
