<div class="annotator__sidebar" data-ng-controller="SidebarController">
    @if ($editMode)
	   @include('annotations::index.sidebar.categories')
    @endif
	<div class="sidebar__permanent">
		<div id="minimap" class="sidebar__minimap" data-ng-controller="MinimapController"></div>
		@include('annotations::index.sidebar.controls')
		@include('annotations::index.sidebar.annotations')
	</div>
</div>
