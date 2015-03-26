@forelse($project->transects as $transect)
	<div class="col-sm-4 col-md-3">
		@include('transects::dashboard.projects.thumb', array('transect' => $transect))
	</div>
@empty
	<div class="col-lg-12 text-muted">
		The project doesn't have any transects yet.
	</div>
@endforelse