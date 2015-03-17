<div class="col-lg-4">
	<div class="panel panel-default">
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
				@forelse($project->admins as $user)
					<tr><td>{{ $user->name }}</td></tr>
				@empty
					<tr><td class="text-muted">No admins.</li></td></tr>
				@endforelse
			</tbody>
		</table>
		<table class="table">
			<thead>
				<tr>
					<th>Editors</th>
				</tr>
			</thead>
			<tbody>
				@forelse($project->editors as $user)
					<tr><td>{{ $user->name }}</td></tr>
				@empty
					<tr><td class="text-muted">No editors.</li></td></tr>
				@endforelse
			</tbody>
		</table>
		<table class="table">
			<thead>
				<tr>
					<th>Guests</th>
				</tr>
			</thead>
			<tbody>
				@forelse($project->guests as $user)
					<tr><td>{{ $user->name }}</td></tr>
				@empty
					<tr><td class="text-muted">No guests.</td></tr>
				@endforelse
			</tbody>
		</table>
	</div>
</div>