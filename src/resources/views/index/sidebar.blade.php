<div class="annotator__sidebar" data-ng-controller="SidebarController">
	@include('annotations::index.sidebar.categories')
	<div class="sidebar__permanent">
		<div id="minimap" class="sidebar__minimap" data-ng-controller="MinimapController">
			
		</div>
		@include('annotations::index.sidebar.controls')
		@include('annotations::index.sidebar.annotations')
	</div>
</div>