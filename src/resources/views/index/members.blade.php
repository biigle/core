<div class="col-lg-4">
	<div class="panel panel-default" data-ng-controller="ProjectMembersController">
		<div class="panel-heading">
			<h3 class="panel-title">Members</h3>
		</div>
		<table class="table">
			<thead>
				<tr>
					<th>Admins</th>
				</tr>
			</thead>
			<tbody>
				<tr data-ng-repeat="user in users | filter: {id: roles.admin} as admins"><td data-ng-bind="user.name"></td></tr>
				<tr data-ng-if="!admins.length"><td class="text-muted">No admins.</li></td></tr>
			</tbody>
		</table>
		<table class="table">
			<thead>
				<tr>
					<th>Editors</th>
				</tr>
			</thead>
			<tbody>
				<tr data-ng-repeat="user in users | filter: {id: roles.editor} as editors"><td data-ng-bind="user.name"></td></tr>
				<tr data-ng-if="!editors.length"><td class="text-muted">No editors.</li></td></tr>
			</tbody>
		</table>
		<table class="table">
			<thead>
				<tr>
					<th>Guests</th>
				</tr>
			</thead>
			<tbody>
				<tr data-ng-repeat="user in users | filter: {id: roles.guest} as guests"><td data-ng-bind="user.name"></td></tr>
				<tr data-ng-if="!guests.length"><td class="text-muted">No guests.</li></td></tr>
			</tbody>
		</table>
	</div>
</div>