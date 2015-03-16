<?php $user = Auth::user() ?>
<h2>Projects</h2>

@forelse($user->projects as $project)
	<div class="panel panel-default">
		<div class="panel-heading">
			<h3 class="panel-title">{{ $project->name }}</h3>
		</div>
		<div class="panel-body">
			@foreach ($mixins as $module => $nestedMixins)
				@include($module.'::dashboard.projects', array('mixins' => $nestedMixins, 'project' => $project))
			@endforeach
		</div>
	</div>
@empty
	<div class="panel panel-default">
		<p class="text-muted">
			You do not belong to any projects.
		</p>
	</div>
@endforelse