<div class="col-sm-6 col-lg-4">
	<div class="panel panel-default" data-ng-controller="ProjectMembersController" data-ng-class="{'panel-warning': editing}">
		<div class="panel-heading">
			<h3 class="panel-title">
				Members
				@if($isAdmin)
					<button class="btn btn-default btn-xs pull-right" title="Edit project members" data-ng-click="edit()" data-ng-class="{active: editing}"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>
				@endif
			</h3>
		</div>
		@foreach (array('admin', 'editor', 'guest') as $role)
			<table class="table" data-project-member-container="" data-role="{{ $role }}">
				<thead  data-ng-class="{'bg-info': hovering}">
					<tr>
						<th>{{ trans('projects::members.'.$role) }}</th>
					</tr>
				</thead>
				<tbody>
					<tr class="project__user ng-cloak" data-ng-repeat="user in users | filter: {project_role_id: roles.{{ $role }}} as {{ $role }}s" class="clearfix">
						<td data-project-member="" draggable="@{{editing}}" data-ng-class="{'bg-danger': removing}">
							<span data-ng-if="!removing">
								<span data-ng-bind="user.name"></span>
								@if($isAdmin)
									<button data-ng-if="editing" type="button" class="close" aria-label="Close" title="Remove this user" data-ng-click="startRemove()"><span aria-hidden="true">&times;</span></button>
								@endif
							</span>
							@if($isAdmin)
								<span data-ng-if="removing" class="ng-cloak">
									Are you sure? <span class="pull-right"><button type="button" class="btn btn-danger btn-xs" data-ng-click="remove()">Remove</button> <button type="button" class="btn btn-default btn-xs" data-ng-click="cancelRemove()">Cancel</button></span>
								</span>
							@endif
						</td>
					</tr>
					<tr data-ng-if="!{{ $role }}s.length"><td class="text-muted">{{ trans('projects::members.no-'.$role) }}</li></td></tr>
				</tbody>
			</table>
		@endforeach
	</div>
</div>