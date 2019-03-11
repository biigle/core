<?php $videoUrl = Storage::disk(config('videos.thumbnail_storage_disk'))->url(''); ?>
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
    <div class="panel-body container-fluid videos-grid">
        <div class="row">
            <div class="col-sm-6" v-for="video in videos" v-bind:key="video.id" v-cloak>
                <a class="video-thumbnail__link" v-bind:href="'{{route('video', '')}}/'+video.id" v-bind:title="'Show video '+video.name">
                    <video-thumbnail class="volume-thumbnail volume-thumbnail--projects" v-bind:tid="video.id" :uuid="video.uuid" :thumb-count="{{config('videos.thumbnail_count')}}" uri="{{ $videoUrl }}" format="{{ config('thumbnails.format') }}" @can('update', $project) v-bind:removable="editing" v-bind:remove-title="'Delete video '+video.name" @endcan v-on:remove="deleteVideo(video)">
                        <img v-bind:src="'{{ $videoUrl }}/'+video.uuid[0]+video.uuid[1]+'/'+video.uuid[2]+video.uuid[3]+'/'+video.uuid+'/'+'0.{{ config('thumbnails.format') }}'" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
                        <figcaption slot="caption" v-text="video.name"></figcaption>
                    </video-thumbnail>
                </a>
            </div>
        </div>
        <span class="text-muted" v-if="!videos.length" v-cloak>This project has no videos.</span>
    </div>
</div>

@push('scripts')
<script src="{{ cachebust_asset('vendor/videos/scripts/main.js') }}"></script>
<script type="text/javascript">
    biigle.$declare('projects.videos', {!! \Biigle\Modules\Videos\Video::where('project_id', $project->id)->get()->toJson() !!});
</script>
@endpush
