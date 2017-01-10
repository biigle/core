@inject('modules', 'Dias\Services\Modules')
<div class="sidebar__foldout settings-foldout" data-ng-class="{open:(foldout=='settings')}">
    <h4>
        Settings
        <button class="btn btn-default pull-right" data-ng-click="toggleFoldout('settings')" title="Collapse this foldout"><span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span></button>
    </h4>

    @include('annotations::index.sidebar.settings.annotation-opacity')
    @include('annotations::index.sidebar.settings.annotation-cycling')
    @include('annotations::index.sidebar.settings.section-cycling')
    @include('annotations::index.sidebar.settings.expert')

    @foreach ($modules->getMixins('annotationsSettings') as $module => $nestedMixins)
        @include($module.'::annotationsSettings')
    @endforeach
</div>
