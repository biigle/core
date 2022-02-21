@extends('app')

@section('title', 'Create new label tree')

@section('content')
<div class="container">
    <div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
        <h2>
            <span class="pull-right">
                @mixin('newLabelTreeButtons')
            </span>
            @if ($project)
                New label tree for {{$project->name}}
            @else
                New label tree
            @endif
        </h2>
        @if ($upstreamLabelTree)
            <p>
                The new label tree will be forked from <a href="{{route('label-trees', $upstreamLabelTree->id)}}">{{$upstreamLabelTree->versionedName}}</a>.
            </p>
        @endif
        <form class="clearfix" role="form" method="POST" action="{{ url('api/v1/label-trees') }}">
            <div class="form-group{{ $errors->has('name') ? ' has-error' : '' }}">
                <label for="name">Name</label>
                <input type="text" class="form-control" name="name" id="name" value="{{ old('name', $upstreamLabelTree ? $upstreamLabelTree->name : '') }}" autofocus required>
                @if($errors->has('name'))
                    <span class="help-block">{{ $errors->first('name') }}</span>
                @endif
            </div>

            <div class="form-group{{ $errors->has('visibility_id') ? ' has-error' : '' }}">
                <label for="visibility_id">Visibility</label>
                <select class="form-control" name="visibility_id" required>
                    @foreach($visibilities as $visibility)
                        <option value="{{$visibility->id}}" @selected($selectedVisibility === $visibility->id)>{{$visibility->name}}</option>
                    @endforeach
                </select>
                @if($errors->has('visibility_id'))
                    <span class="help-block">{{ $errors->first('visibility_id') }}</span>
                @endif
            </div>

            <div class="form-group{{ $errors->has('description') ? ' has-error' : '' }}">
                <label for="description">Description (optional)</label>
                <input class="form-control" type="text" name="description" id="description" value="{{ old('description', $upstreamLabelTree ? $upstreamLabelTree->description : '') }}">
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
            @if ($upstreamLabelTree)
                <input class="form-control" type="hidden" name="upstream_label_tree_id" id="upstream_label_tree_id" value="{{ $upstreamLabelTree->id }}">
                <input type="submit" class="btn btn-success pull-right" value="Create fork">
            @else
                <input type="submit" class="btn btn-success pull-right" value="Create">
            @endif
            <a href="{{ URL::previous() }}" class="btn btn-link">Cancel</a>
        </form>
    </div>
</div>
@endsection
