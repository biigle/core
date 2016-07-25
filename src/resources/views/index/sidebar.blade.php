@inject('modules', 'Dias\Services\Modules')
<div class="annotator__sidebar" data-ng-controller="SidebarController">
      @if ($editMode)
         @include('annotations::index.sidebar.categories')
         @include('annotations::index.sidebar.settings')
      @endif
    @include('annotations::index.sidebar.filters')
    @foreach ($modules->getMixins('annotationsSidebarFoldouts') as $module => $nestedMixins)
            @include($module.'::annotationsSidebarFoldouts')
      @endforeach
      <div class="sidebar__permanent">
      <div id="minimap" class="sidebar__minimap" data-ng-controller="MinimapController"></div>
      @include('annotations::index.sidebar.controls')
      @foreach ($modules->getMixins('annotationsSidebar') as $module => $nestedMixins)
            @include($module.'::annotationsSidebar')
      @endforeach
      @include('annotations::index.sidebar.annotations')
   </div>
</div>
