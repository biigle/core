<div class="col-sm-6 col-lg-4">
	<div class="panel panel-default">
		<div class="panel-heading">
			<h3 class="panel-title">EXIF</h3>
		</div>
		<table class="table">
			@if ($exif = $file->exif())
				@foreach (array('DateTime', 'Model', 'ShutterSpeedValue', 'ApertureValue', 'Flash', 'GPS Latitude', 'GPS Longitude', 'GPS Altitude') as $field)
					<?php if (!array_key_exists($field, $exif)) continue; ?>
					<tr>
						<th>{{ $field }}</th>
						<td>{{ $exif[$field] }}</td>
					</tr>
				@endforeach
			@else
				<tr><td>No EXIF data</td></tr>
			@endif
		</table>
	</div>
</div>