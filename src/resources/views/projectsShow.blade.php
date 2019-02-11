<div id="projects-show-video-list" class="panel panel-default" v-bind:class="{'panel-warning':editing}">
    <div class="panel-heading">
        Videos
        @can('update', $project)
            <span class="pull-right">
                <loader :active="loading"></loader>
                <a href="{{ route('create-video') }}?project={{ $project->id }}" class="btn btn-default btn-xs" title="Create a new video"><span class="fa fa-plus" aria-hidden="true"></span></a>
                <button class="btn btn-default btn-xs" title="Edit videos" v-on:click="toggleEditing"><span class="fa fa-pencil-alt" aria-hidden="true"></span></button>
            </span>
        @endcan
    </div>
    <ul class="list-group" v-cloak>
        <li class="list-group-item" v-for="video in videos">
            <a :href="'{{route('video', '')}}/' + video.id" v-text="video.name"></a>
            <span v-if="editing" class="btn btn-xs btn-danger pull-right" v-on:click="deleteVideo(video)" :title="'Delete video ' + video.name">
                Delete
            </span>
        </li>
        <li v-if="hasNoVideos" class="list-group-item text-muted">This project has no videos.</li>
    </ul>
</div>

@push('scripts')
<script src="{{ cachebust_asset('vendor/videos/scripts/main.js') }}"></script>
<script type="text/javascript">
    biigle.$declare('projects.videos', {!! \Biigle\Modules\Videos\Video::where('project_id', $project->id)->get()->toJson() !!});
</script>
@endpush
