@extends('app')

@section('title')@parent {{ $project->name }} @stop

@include('projects::assets')

@section('content')
<div class="container" data-ng-app="dias.projects">
	<h2 class="col-lg-12 clearfix">
		{{ $project->name }} <small>#{{ $project->id }}</small>
		@if($project->hasAdmin($user))
			<button class="pull-right btn btn-default" data-ng-controller="ProjectDeleteController" data-ng-click="submit()" data-success-msg="<strong>Project deleted.</strong> Redirecting to dashboard..." data-success-redirect-url="{{ route('home') }}" data-error-msg="There was an error when deleting this project.">Delete this project</button>
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

	@if($project->hasAdmin($user))
		<script type="text/ng-template" id="confirmDeleteModal.html">
		<div class="modal-header">
			<h3 class="modal-title">Confirm deletion</h3>
		</div>
		<div class="modal-body">
			<div data-ng-if="!force">
				Do you really want to delete this project?
			</div>
			<div data-ng-if="force">
				<strong>One or more transects would be deleted with this project.</strong> Do you still want to continue?
			</div>
		</div>
		<div class="modal-footer">
			<button data-ng-if="!force" class="btn btn-danger" data-ng-click="delete({{ $project->id }})">Delete</button>
			<button data-ng-if="force" class="btn btn-danger" data-ng-click="delete({{ $project->id }})">Yes, delete</button>
			<button class="btn btn-default" data-ng-click="$close('cancel')">Cancel</button>
		</div>
		</script>
	@endif
</div>
@endsection
