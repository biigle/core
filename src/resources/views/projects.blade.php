@section('scripts')
<script src="{{ asset('vendor/transects/scripts/projects.js') }}"></script>
@append

<div class="col-sm-6 col-lg-4">
	<div class="panel panel-default" data-ng-controller="ProjectTransectsController" data-ng-class="{'panel-warning': editing}">
		<div class="panel-heading">
			<h3 class="panel-title">
				Transects
				<span class="pull-right">
					@if($isAdmin)
						<a href="{{ route('create-transect') }}?project={{ $project->id }}" class="btn btn-default btn-xs" title="Add new transect"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></a>
						<button class="btn btn-default btn-xs" title="Edit transects" data-ng-if="transects.length" data-ng-click="edit()" data-ng-class="{active: editing}"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>
					@endif
				</span>
			</h3>
		</div>
		<ul class="list-group">
			<li class="list-group-item" data-ng-class="{'list-group-item-danger': removing}" data-ng-controller="ProjectTransectController" data-ng-repeat="transect in transects">
				<span data-ng-if="!removing">
					<a href="{{ url('transects') }}/@{{ transect.id }}" data-ng-bind="transect.name"></a>
					@if($isAdmin)
						<button data-ng-if="editing" type="button" class="close ng-cloak" aria-label="Close" title="Remove this transect" data-ng-click="startRemove()"><span aria-hidden="true">&times;</span></button>
					@endif
				</span>
				@if($isAdmin)
					<span data-ng-if="removing" class="ng-cloak">
						Are you sure? <span class="pull-right"><button type="button" class="btn btn-danger btn-xs" data-ng-click="remove()">Remove</button> <button type="button" class="btn btn-default btn-xs" data-ng-click="cancelRemove()">Cancel</button></span>
					</span>
				@endif
			</li>
			<li data-ng-if="!transects.length" class="list-group-item text-muted">No transects.</li>
		</ul>
	</div>
</div>

@if($isAdmin)
	<script type="text/ng-template" id="confirmDeleteTransectModal.html">
	<div class="modal-header">
		<h3 class="modal-title">Confirm delete transect</h3>
	</div>
	<div class="modal-body">
		<strong>The transect you are about to remove belongs only to this project and would be deleted.</strong> Are you sure you want to delete this transect?
	</div>
	<div class="modal-footer">
		<button class="btn btn-danger" data-ng-click="$close('force')">Delete</button>
		<button class="btn btn-default" data-ng-click="$close()">Cancel</button>
	</div>
	</script>
@endif
