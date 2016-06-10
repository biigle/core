<div class="panel panel-default" data-ng-controller="TransectsController" data-ng-class="{'panel-warning':isEditing()}">
    <div class="panel-heading">
        Transects
        @can('update', $project)
            <span class="pull-right">
                <span class="ng-cloak" data-ng-if="isLoading()">loading...</span>
                @if(Route::has('create-transect'))
                    <a href="{{ route('create-transect') }}?project={{ $project->id }}" class="btn btn-default btn-xs" title="Add new transect"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></a>
                @endif
                <button class="btn btn-default btn-xs @if($transects->count() === 0) ng-hide @endif" title="Edit transects" data-ng-click="toggleEditing()" data-ng-class="{active: isEditing()}" data-ng-show="hasTransects()"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>
            </span>
        @endcan
    </div>
    <ul class="list-group list-group-restricted">
        @can('update', $project)
            <li data-ng-if="hasTransects()" class="ng-cloak list-group-item clearfix" data-ng-repeat="transect in getTransects() | orderBy: 'updated_at'">
                    <button data-ng-if="isEditing()" type="button" class="close pull-right" aria-label="Close" title="Detach transect @{{transect.name}}" data-ng-click="detachTransect(transect)"><span aria-hidden="true">&times;</span></button>
                @if (Route::has('transect'))
                    <a href="{{route('transect', '')}}/@{{transect.id}}" data-ng-bind="transect.name"></a>
                @else
                    <span data-ng-bind="transect.name"></span>
                @endif
            </li>
            <li class="list-group-item @if($transects->count() > 0) ng-hide @endif" data-ng-show="!hasTransects()">
                This project has no transects
            </li>
        @else
            @forelse($transects as $transect)
                @if (Route::has('transect'))
                    <li class="list-group-item"><a href="{{route('transect', $transect->id)}}">{{$transect->name}}</a></li>
                @else
                    <li class="list-group-item">{{$transect->name}}</li>
                @endif
            @empty
                <li class="list-group-item">
                    This project has no transects
                </li>
            @endforelse
        @endcan
    </ul>
</div>
