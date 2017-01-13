<div class="volume-menubar">
    @can ('update', $volume)
        @include('volumes::index.menubar.edit')
    @endcan

    @can ('edit-in', $volume)
        @include('volumes::index.menubar.label')
    @endcan

    @include('volumes::index.menubar.filter')
    @include('volumes::index.menubar.sort')

    @foreach ($modules->getMixins('volumesMenubar') as $module => $nestedMixins)
        @include($module.'::volumesMenubar')
    @endforeach
</div>
