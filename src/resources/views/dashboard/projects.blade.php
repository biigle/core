@forelse($project->transects as $transect)
	<div class="col-lg-3">
		@include('transects::dashboard.projects.thumb', array('transect' => $transect))
	</div>
@empty
	<p class="text-muted">
		The project doesn't have any transects yet.
	</p>
@endforelse