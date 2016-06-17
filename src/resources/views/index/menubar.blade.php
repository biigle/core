<div class="transect-menubar">
    @can ('update', $transect)
        @include('transects::index.menubar.edit')
    @endcan

    @include('transects::index.menubar.filter')
    @include('transects::index.menubar.sort')

    @can ('edit-in', $transect)
        @include('transects::index.menubar.label')
    @endcan

    @foreach ($modules->getMixins('transectsMenubar') as $module => $nestedMixins)
        @include($module.'::transectsMenubar')
    @endforeach
</div>
