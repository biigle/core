<div id="projects-show-video-list" class="panel panel-default" v-bind:class="{'panel-warning':editing}">
    <div class="panel-heading">
        Videos
        @can('update', $project)
            <span class="pull-right">
                <loader :active="loading"></loader>
                <a href="{{ route('create-video') }}?project={{ $project->id }}" class="btn btn-default btn-xs" title="Create a new video"><span class="fa fa-plus" aria-hidden="true"></span></a>
                <button class="btn btn-default btn-xs" title="Edit videos" v-cloak v-on:click="toggleEditing"><span class="fa fa-pencil-alt" aria-hidden="true"></span></button>
            </span>
        @endcan
    </div>
    <div class="panel-body container-fluid videos-grid">
        <div class="row">
            @forelse(\Biigle\Modules\Videos\Video::where('project_id', $project->id)->get() as $video)
                <div class="col-xs-12">
                    <a href="{{route('video', $video->id)}}">{{$video->name}}</a>
                </div>
            @empty
                <div class="col-xs-12 text-muted">This project has no videos.</div>
            @endforelse
        </div>
    </div>
</div>
