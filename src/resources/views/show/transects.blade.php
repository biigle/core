<div class="panel panel-default" data-ng-controller="TransectsController" data-ng-class="{'panel-warning':isEditing()}">
    <div class="panel-heading">
        Transects
        @can('update', $project)
            <span class="pull-right">
                <span class="ng-cloak" data-ng-if="isLoading()">loading...</span>
                @if(Route::has('create-transect'))
                    <a href="{{ route('create-transect') }}?project={{ $project->id }}" class="btn btn-default btn-xs" title="Create a new transect"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></a>
                @endif
                <button class="btn btn-default btn-xs @if($transects->count() === 0) ng-hide @endif" title="Edit transects" data-ng-click="toggleEditing()" data-ng-class="{active: isEditing()}" data-ng-show="hasTransects()"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>
            </span>
        @endcan
    </div>
    @can('update', $project)
        <div class="panel-body ng-cloak" data-ng-if="isEditing()">
            <form class="form-inline"  data-ng-submit="attachTransect()">
                <input class="form-control" type="text" placeholder="Find transect to attach" data-ng-model="data.transectToAttach" data-uib-typeahead="transect as transect.name for transect in getAttachableTransects($viewValue) | filter:$viewValue | limitTo:10" />
                <button class="btn btn-default" type="submit" data-ng-disabled="!data.transectToAttach.name" title="Attach transect @{{data.transectToAttach.name}}">Attach</button>
                <p class="help-block">
                    Transects can be shared between projects. Here you can attach transects from other projects to this project. To attach a transect, you need to be admin in one of the projects, the transect is already attached to.
                </p>
            </form>
        </div>
    @endcan
    <ul class="list-group list-group-transects">
        @can('update', $project)
            <li data-ng-if="hasTransects()" class="ng-cloak list-group-item clearfix" data-ng-repeat="transect in getTransects() | orderBy: 'updated_at'">
                    <button data-ng-if="isEditing()" type="button" class="close pull-right" aria-label="Close" title="Detach transect @{{transect.name}}" data-ng-click="detachTransect(transect)"><span aria-hidden="true">&times;</span></button>
                @if (Route::has('transect'))
                    <a href="{{route('transect', '')}}/@{{transect.id}}" data-ng-bind="transect.name"></a>
                @else
                    <span data-ng-bind="transect.name"></span>
                @endif
            </li>
            <li class="list-group-item @if($transects->count() > 0) ng-cloak @endif" data-ng-if="!hasTransects()">
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
