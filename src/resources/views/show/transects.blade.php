<div id="projects-show-transect-list" class="panel panel-default transects-panel" v-bind:class="{'panel-warning':editing}">
    <div class="panel-heading">
        Transects
        @can('update', $project)
            <span class="pull-right">
                <span class="loader" v-bind:class="{'loader--active':loading}"></span>
                @if(Route::has('create-transect'))
                    <a href="{{ route('create-transect') }}?project={{ $project->id }}" class="btn btn-default btn-xs" title="Create a new transect"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></a>
                @endif
                <button class="btn btn-default btn-xs" title="Edit transects" v-cloak v-on:click="edit"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>
            </span>
        @endcan
    </div>
    @can('update', $project)
        <div class="panel-body" v-if="editing" v-cloak>
            <form class="form-inline">
                <input class="form-control" type="text" placeholder="Find transect to attach" />
                <button class="btn btn-default" type="submit" title="Attach transect">Attach</button>
                <p class="help-block">
                    Transects can be shared between projects. Here you can attach transects from other projects to this project. To attach a transect, you need to be admin in one of the projects, the transect is already attached to.
                </p>
            </form>
        </div>
    @endcan
    <div class="panel-body container-fluid">
        <div class="row">
            <div class="col-sm-6" v-for="transect in transects" v-cloak>
                <a class="transect-thumbnail__link" v-bind:href="'{{route('transect', '')}}/'+transect.id" v-bind:title="'Show transect '+transect.name">
                    <transect-thumbnail class="transect-thumbnail transect-thumbnail--projects" v-bind:tid="transect.id" uri="{{ asset(config('thumbnails.uri')) }}" format="{{ config('thumbnails.format') }}" @can('update', $project) v-bind:removable="editing" v-bind:remove-title="'Detach transect '+transect.name" @endcan v-on:remove="removeTransect">
                        <img v-if="transect.thumbnail" v-bind:src="'{{ asset(config('thumbnails.uri')) }}/'+transect.thumbnail.uuid+'.{{ config('thumbnails.format') }}'" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
                        <img v-if="!transect.thumbnail" src="{{ asset(config('thumbnails.empty_url')) }}">
                        <figcaption slot="caption" v-text="transect.name"></figcaption>
                    </transect-thumbnail>
                </a>
            </div>
        </div>
        <span class="text-muted" v-if="!transects.length" v-cloak>This project has no transects.</span>
    </div>
</div>
