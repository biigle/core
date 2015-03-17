@extends('app')

@section('title')@parent {{ $project->name }} @stop

@include('projects::assets')

@section('content')
@include('partials.messages')
<div class="container" data-ng-app="dias.projects">
	<h2 class="col-lg-12 clearfix">
		{{ $project->name }} <small>#{{ $project->id }}</small>
		@if($project->hasAdmin($user))
			<form role="form" method="POST" action="{{ url('api/v1/projects/'.$project->id) }}" class="pull-right">
				<input type="hidden" name="_method" value="delete" />
				<input type="hidden" name="_token" value="{{ csrf_token() }}">
				<input data-confirm-click="Do you really want to delete the project?" type="submit" class="btn btn-danger" value="Delete project">
			</form>
		@endif
	</h2>
	<div class="col-lg-4">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h3 class="panel-title">Description</h3>
			</div>
			<div class="panel-body">
				{{ $project->description }}
			</div>
		</div>
	</div>
	
	@include('projects::index.members', array('project' => $project))

	@foreach ($mixins as $module => $nestedMixins)
		@include($module.'::index', array('mixins' => $nestedMixins, 'project' => $project))
	@endforeach
</div>
@endsection
