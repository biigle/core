@extends('app')

@section('title', 'Create new label tree')

@section('content')
<div class="container">
    <div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
        @if ($project)
            <h2>New label tree for {{$project->name}}</h2>
        @else
            <h2>New label tree</h2>
        @endif
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

            @if ($project)
                <div class="form-group{{ $errors->has('project_id') ? ' has-error' : '' }}">
                    <label for="project_name">Project</label>
                    <input class="form-control" type="text" id="project_name" value="{{ $project->name }} (#{{ $project->id }})" tabindex="-1" readonly>
                    <input class="form-control" type="hidden" name="project_id" id="project_id" value="{{ $project->id }}">
                    @if($errors->has('project_id'))
                        <span class="help-block">{{ $errors->first('project_id') }}</span>
                    @endif
                </div>
            @endif
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <input type="submit" class="btn btn-success pull-right" value="Create">
            <a href="{{ URL::previous() }}" class="btn btn-link">Cancel</a>
        </form>
    </div>
</div>
@endsection
