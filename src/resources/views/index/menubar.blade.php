<div class="transect-menubar">
    @can ('update', $transect)
        @include('transects::index.menubar.edit')
    @endcan

    @can ('edit-in', $transect)
        @include('transects::index.menubar.label')
    @endcan

    @include('transects::index.menubar.filter')
    @include('transects::index.menubar.sort')

    @foreach ($modules->getMixins('transectsMenubar') as $module => $nestedMixins)
        @include($module.'::transectsMenubar')
    @endforeach
</div>
