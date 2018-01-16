<div id="projects-show-volume-list" class="panel panel-default" v-bind:class="{'panel-warning':editing}">
    <div class="panel-heading">
        Volumes
        @can('update', $project)
            <span class="pull-right">
                <loader :active="loading"></loader>
                @if(Route::has('create-volume'))
                    <a href="{{ route('create-volume') }}?project={{ $project->id }}" class="btn btn-default btn-xs" title="Create a new volume"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span></a>
                @endif
                <button class="btn btn-default btn-xs" title="Edit volumes" v-cloak v-on:click="toggleEditing"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>
            </span>
        @endcan
    </div>
    @can('update', $project)
        <div class="panel-body" v-if="editing" v-cloak>
            <form>
                <label>Volume to attach</label>
                <typeahead class="typeahead--block" :items="attachableVolumes" placeholder="Volume name" v-on:select="attachVolume" :clear-on-select="true"></typeahead>
                <p class="help-block">
                    Volumes can be shared between projects. Here you can attach volumes from other projects to this project. To attach a volume, you need to be admin in one of the projects, the volume is already attached to.
                </p>
            </form>
        </div>
    @endcan
    <div class="panel-body container-fluid volumes-grid">
        <div class="row">
            <div class="col-sm-6" v-for="volume in volumes" v-bind:key="volume.id" v-cloak>
                <a class="volume-thumbnail__link" v-bind:href="'{{route('volume', '')}}/'+volume.id" v-bind:title="'Show volume '+volume.name">
                    <volume-thumbnail class="volume-thumbnail volume-thumbnail--projects" v-bind:tid="volume.id" uri="{{ asset(config('thumbnails.uri')) }}" format="{{ config('thumbnails.format') }}" @can('update', $project) v-bind:removable="editing" v-bind:remove-title="'Detach volume '+volume.name" @endcan v-on:remove="removeVolume">
                        <img v-if="volume.thumbnail" v-bind:src="'{{ asset(config('thumbnails.uri')) }}/'+volume.thumbnail.uuid[0]+volume.thumbnail.uuid[1]+'/'+volume.thumbnail.uuid[2]+volume.thumbnail.uuid[3]+'/'+volume.thumbnail.uuid+'.{{ config('thumbnails.format') }}'" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
                        <img v-if="!volume.thumbnail" src="{{ asset(config('thumbnails.empty_url')) }}">
                        <figcaption slot="caption" v-text="volume.name"></figcaption>
                    </volume-thumbnail>
                </a>
            </div>
        </div>
        <span class="text-muted" v-if="!volumes.length" v-cloak>This project has no volumes.</span>
    </div>
</div>
