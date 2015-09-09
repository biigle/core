<div class="row">
    @forelse($project->transects as $transect)
    	<div class="col-sm-4 col-lg-6">
    		@include('transects::dashboard.projects.thumb', array('transect' => $transect))
    	</div>
    @empty
    	<div class="col-xs-12 text-muted">
    		The project doesn't have any transects yet.
    	</div>
    @endforelse
</div>
