@extends('app')

@section('title'){{ $project->name }}@stop

@include('projects::assets')

@section('content')
<?php $isAdmin = $project->hasAdmin($user); ?>
<div class="container" data-ng-app="dias.projects" data-ng-controller="ProjectIndexController" data-project-id="{{ $project->id }}" data-user-id="{{ $user->id }}" data-leaving-success-msg="Project left. Redirecting to dashboard..." data-dashboard-url="{{ route('home') }}">
	<h2 class="col-lg-12 clearfix">
		{{ $project->name }} <small title="Project ID {{ $project->id }}">#{{ $project->id }}</small>
		<span class="pull-right">
			<button class="btn btn-default" data-ng-click="leaveProject()" title="Leave {{ $project->name }}">Leave</button>
			@if($isAdmin)
				<button class="btn btn-default" data-ng-controller="ProjectDeleteController" data-ng-click="submit()" data-success-msg="Project deleted. Redirecting to dashboard..." data-error-msg="There was an error when deleting this project." title="Delete {{ $project->name }}">Delete</button>
			@endif
		</span>
	</h2>
	
	@include('projects::index.info')

	@include('projects::index.members', array('project' => $project))

	@foreach ($mixins as $module => $nestedMixins)
		@include($module.'::index', array('mixins' => $nestedMixins, 'project' => $project))
	@endforeach

	@if($isAdmin)
		<script type="text/ng-template" id="confirmDeleteModal.html">
		<div class="modal-header">
			<h3 class="modal-title">Confirm deletion</h3>
		</div>
		<div class="modal-body">
			<div data-ng-if="!force">
				Are you sure you want to delete <strong>{{ $project->name }}</strong>?
			</div>
			<div data-ng-if="force">
				<strong>One or more transects would be deleted with this project.</strong> Do you still want to continue?
			</div>
		</div>
		<div class="modal-footer">
			<button data-ng-if="!force" class="btn btn-danger" data-ng-click="delete()">Delete</button>
			<button data-ng-if="force" class="btn btn-danger" data-ng-click="delete()">Yes, delete</button>
			<button class="btn btn-default" data-ng-click="$close()">Cancel</button>
		</div>
		</script>

		<script type="text/ng-template" id="confirmLeaveProjectModal.html">
		<div class="modal-header">
			<h3 class="modal-title">Confirm leaving project</h3>
		</div>
		<div class="modal-body">
			<strong>Are you sure you want to leave {{ $project->name }}?</strong> You will not be able to join on your own again.
		</div>
		<div class="modal-footer">
			<button class="btn btn-danger" data-ng-click="$close('yes')">Leave</button>
			<button class="btn btn-default" data-ng-click="$close()">Cancel</button>
		</div>
		</script>
	@endif
</div>
@endsection
