@inject('modules', 'Dias\Services\Modules')

<div class="transect__sidebar" data-ng-controller="SidebarController" data-exif-keys="DateTime,Model,ShutterSpeedValue,ApertureValue,Flash,GPSLatitude,GPSLongitude,GPSAltitude">
	<h2 class="sidebar__title">
		{{ $transect->name }} <small title="Transect ID {{ $transect->id }}">#{{ $transect->id }} ({{ $transect->images->count() }} images)</small>
	</h2>
	<div class="btn-group sidebar__buttons">
		<button class="btn btn-default" title="Go to the image page when clicking an image" data-image-url="{{ route('image', '') }}" data-ng-controller="ImagePageButtonController" data-ng-click="activate()" data-ng-class="{active:selected}"><span class="glyphicon glyphicon-picture" aria-hidden="true"></span></button>
		@foreach ($modules->getMixins('transects') as $module => $nestedMixins)
			@include($module.'::transects', array('mixins' => $nestedMixins))
		@endforeach
	</div>
	<div class="sudebar__panels" data-ng-if="active.image && imageData.$resolved">
		<div class="panel panel-default">
			<div class="panel-heading">
				<h3 class="panel-title">Meta info</h3>
			</div>
			<table class="table">
				<tr>
					<th>Filename</th>
					<td data-ng-bind="imageData.exif['FileName']"></td>
				</tr>
				<tr>
					<th>Dimensions</th>
					<td>@{{ imageData.width }} &times; @{{ imageData.height }} px</td>
				</tr>
				<tr>
					<th>Size</th>
					<td>@{{ imageData.exif['FileSize'] / 1e6 | number:2}} MByte</td>
				</tr>
			</table>
		</div>
		<div class="panel panel-default">
			<div class="panel-heading">
				<h3 class="panel-title">EXIF</h3>
			</div>
			<table class="table">
				<tr data-ng-repeat="key in exifKeys" data-ng-if="imageData.exif[key]">
					<th data-ng-bind="key"></th>
					<td data-ng-bind="imageData.exif[key]"></td>
				</tr>
			</table>
		</div>
	</div>
</div>
