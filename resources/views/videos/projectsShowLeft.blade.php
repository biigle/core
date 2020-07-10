<div id="projects-show-video-list" class="panel panel-default" v-bind:class="{'panel-warning':editing}"  v-bind:style="panelStyle">
    <div class="panel-heading">
        Videos
        <span class="pull-right">
            @can('update', $project)
                <loader :active="loading"></loader>
            @endcan
            <form v-cloak v-if="hasVideos" class="panel-filter" :class="filterInputClass">
                <span class="form-group has-feedback">
                    <input class="form-control input-sm" type="text" name="filter" placeholder="Filter videos" v-model="filterString" v-on:keyup.esc="clearFiltering">
                    <span v-cloak v-show="hasFiltering" v-on:click="clearFiltering" title="Clear filtering" class="form-control-feedback" aria-hidden="true"><i class="fas fa-times fa-sm"></i></span>
                </span>
            </form>
            @can('update', $project)
                <a href="{{ route('create-video') }}?project={{ $project->id }}" class="btn btn-default btn-xs" title="Create a new video"><span class="fa fa-plus" aria-hidden="true"></span></a>
                <button class="btn btn-default btn-xs" title="Edit videos" v-on:click="toggleEditing"><span class="fa fa-pencil-alt" aria-hidden="true"></span></button>
            @endcan
        </span>
    </div>
    <div class="panel-body container-fluid volumes-grid">
        <div class="row">
            <div class="col-sm-6" v-for="video in filteredVideos" v-bind:key="video.id" v-cloak>
                <a v-bind:href="'{{route('video', '')}}/'+video.id" v-bind:title="'Show video '+video.name">
                    <preview-thumbnail class="preview-thumbnail preview-thumbnail--projects" v-bind:id="video.id" :thumb-uris="video.thumbnailsUrl" @can('update', $project) v-bind:removable="editing" v-bind:remove-title="'Delete video '+video.name" @endcan v-on:remove="deleteVideo(video)">
                        <img v-bind:src="video.thumbnailUrl" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
                        <figcaption slot="caption" v-text="video.name"></figcaption>
                    </preview-thumbnail>
                </a>
            </div>
        </div>
        <span class="text-muted" v-if="hasNoMatchingVideos" v-cloak>No video matches this query.</span>
        <span class="text-muted" v-if="!hasVideos" v-cloak>This project has no videos.</span>
    </div>
</div>

@push('scripts')
<script src="{{ cachebust_asset('vendor/videos/scripts/main.js') }}"></script>
<script type="text/javascript">
    biigle.$declare('projects.videos', {!!
        \Biigle\Modules\Videos\Video::where('project_id', $project->id)
            ->orderBy('updated_at', 'desc')
            ->get()
            ->each(function ($item) {
                $item->append('thumbnailUrl');
                $item->append('thumbnailsUrl');
            })
            ->toJson()
    !!});
</script>
@endpush
