<div class="settings-foldout__item" data-ng-controller="ExportAreaSettingsController">
    <h4 class="clearfix">
        @can('update', $transect)
            <span class="pull-right">
                <button class="btn btn-default btn-sm" title="Edit the export area for this transect" data-ng-click="edit()" data-ng-class="{active:isEditing()}"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>
                <button class="btn btn-default btn-sm" title="Remove the export area for this transect" data-ng-click="delete()"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
            </span>
        @endcan
        Export area
    </h4>

    <label title="Opacity of the export area">Opacity <span class="ng-cloak" data-ng-switch="isShown()">(<span data-ng-switch-when="true" data-ng-bind="export_area_opacity | number:2"></span><span data-ng-switch-default="">hidden</span>)</span></label>
    <input type="range" min="0" max="1" step="0.01" data-ng-model="export_area_opacity">
</div>
