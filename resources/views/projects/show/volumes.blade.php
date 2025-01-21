@extends('projects.show.base')

@push('scripts')
<script type="module">
    biigle.$declare('projects.volumes', {!! $volumes !!});
    biigle.$declare('projects.volumeUrlTemplate', '{{url("volumes/clone/:id/?project={$project->id}")}}')
</script>
@endpush

@section('project-content')
<div id="projects-show-volumes" class="project-volumes">
    <div class="clearfix">
        <span class="btn-group">
            <button class="btn btn-default" :class="toggleImageVolumesClass" title="Show only image volumes" v-on:click="toggleImageVolumes" :disabled="(!hasVolumes || !hasMixedMediaTypes) || null"><i class="fa fa-image"></i></button>
            <button class="btn btn-default" :class="toggleVideoVolumesClass" title="Show only video volumes" v-on:click="toggleVideoVolumes" :disabled="(!hasVolumes || !hasMixedMediaTypes) || null"><i class="fa fa-film"></i></button>
        </span>
        <form class="volume-filter" :class="filterInputClass">
            <span class="form-group has-feedback">
                <input class="form-control" type="text" name="filter" placeholder="Filter volumes" v-model="filterString" v-on:keyup.esc="clearFiltering" :disabled="!hasVolumes || null">
                <span v-cloak v-show="hasFiltering" v-on:click="clearFiltering" title="Clear filter query" class="form-control-feedback" aria-hidden="true"><i class="fas fa-times fa-sm"></i></span>
            </span>
        </form>
        <span class="btn-group">
            <button class="btn btn-default" :class="sortByDateDownClass" title="Sort volumes by newest first" v-on:click="sortByDateDown" :disabled="!hasVolumes || null"><i class="fa fa-sort-numeric-down"></i></button>
            <button class="btn btn-default" :class="sortByDateUpClass" title="Sort volumes by oldest first" v-on:click="sortByDateUp" :disabled="!hasVolumes || null"><i class="fa fa-sort-numeric-up"></i></button>
            <button class="btn btn-default" :class="sortByNameDownClass" title="Sort volumes by name" v-on:click="sortByNameDown" :disabled="!hasVolumes || null"><i class="fa fa-sort-alpha-down"></i></button>
            <button class="btn btn-default" :class="sortByNameUpClass" title="Sort volumes by name (reversed)" v-on:click="sortByNameUp" :disabled="!hasVolumes || null"><i class="fa fa-sort-alpha-up"></i></button>
        </span>
        @can('update', $project)
            <span class="pull-right">
                <loader :active="loading"></loader>
                <a href="{{ route('create-volume') }}?project={{ $project->id }}" class="btn btn-default" title="Create a new volume for this project">Create Volume</a>
                <typeahead :scrollable="true" :disabled="loading || null" :items="attachableVolumes" placeholder="Attach volumes" v-on:select="attachVolume" :clear-on-select="true" title="Attach existing volumes of other projects" v-on:fetch="fetchAttachableVolumes"></typeahead>
            </span>
        @endcan
    </div>
    <div class="row">
        <div class="col-sm-4 col-md-3" v-for="volume in filteredVolumes" v-bind:key="volume.id" v-cloak>
            <a v-bind:href="'{{route('volume', '')}}/'+volume.id" v-bind:title="'Show volume '+volume.name">
                <preview-thumbnail class="preview-thumbnail--projects" v-bind:id="volume.id" :thumb-uris="volume.thumbnailsUrl" @can('update', $project) v-bind:removable="true" v-bind:remove-title="'Detach volume '+volume.name" v-on:remove="removeVolume" v-bind:statistics-title="'Show charts for '+volume.name" v-bind:volume-url-template="volumeUrlTemplate" v-bind:show-clone-button="true" v-bind:clone-volume-title="'Clone volume '+volume.name" @endcan v-bind:show-stats-button="true" v-on:statistics="showStatistics" :icon="volume.icon">
                    <img v-bind:src="volume.thumbnailUrl" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
                    <template #caption>
                        <figcaption v-text="volume.name"></figcaption>
                    </template>
                </preview-thumbnail>
            </a>
        </div>
    </div>
    <statistics-modal v-bind:show-modal="showModal" v-bind:statistics-data="statisticsData" v-on:close-modal="hideStatisticsModal"></statistics-modal>
    <div v-if="hasNoMatchingVolumes" v-cloak class="well volume-info-well">
        No volume matches this filter query. <a href="#" v-on:click="clearFiltering">Clear filter query.</a>
    </div>
    <div v-if="!hasVolumes" v-cloak class="well volume-info-well">
        This project has no volumes.
        @can('update', $project)
            <a href="{{ route('create-volume') }}?project={{ $project->id }}" title="Create a new volume">Create the first volume.</a>
        @else
            Ask a project admin to create the first volume.
        @endcan
    </div>
</div>
@endsection
