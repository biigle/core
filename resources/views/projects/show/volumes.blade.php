@extends('app')
@section('title', $project->name)

@push('scripts')
<script type="text/javascript">
    biigle.$declare('projects.volumes', {!! $volumes !!});
    biigle.$declare('projects.project', {!!$project!!});
    biigle.$declare('projects.userId', {!! $user->id !!});
    biigle.$declare('projects.redirectUrl', '{{route('home')}}');
</script>
@endpush

@section('content')
<div class="container">
    @include('projects.show.title')
    <ul class="nav nav-tabs">
        <li role="presentation" class="active">
            <a href="{{route('project', $project->id)}}" title="Show the volumes attached to the project"><i class="fa fa-folder"></i> Volumes <span class="badge">{{readable_number($project->volumes()->count())}}</span></a>
        </li>
        <li role="presentation">
            <a href="#" title="Show the label trees attached to the project"><i class="fa fa-tags"></i> Label Trees <span class="badge">{{readable_number($project->labelTrees()->count())}}</span></a>
        </li>
        <li role="presentation">
            <a href="#" title="Show the members of the project"><i class="fa fa-users"></i> Members <span class="badge">{{readable_number($project->users()->count())}}</span></a>
        </li>
        @mixin('projectsShowV2Tabs')
    </ul>
    <div id="projects-show-volumes" class="project-volumes">
        <div class="top-bar clearfix">
            <span class="btn-group">
                <button class="btn btn-default" :class="toggleImageVolumesClass" title="Toggle display of image volumes" v-on:click="toggleImageVolumes" :disabled="!hasVolumes || !hasMixedMediaTypes"><i class="fa fa-image"></i></button>
                <button class="btn btn-default" :class="toggleVideoVolumesClass" title="Toggle display of video volumes" v-on:click="toggleVideoVolumes" :disabled="!hasVolumes || !hasMixedMediaTypes"><i class="fa fa-film"></i></button>
            </span>
            <form class="volume-filter" :class="filterInputClass">
                <span class="form-group has-feedback">
                    <input class="form-control" type="text" name="filter" placeholder="Filter volumes" v-model="filterString" v-on:keyup.esc="clearFiltering" :disabled="!hasVolumes">
                    <span v-cloak v-show="hasFiltering" v-on:click="clearFiltering" title="Clear filter query" class="form-control-feedback" aria-hidden="true"><i class="fas fa-times fa-sm"></i></span>
                </span>
            </form>
            @can('update', $project)
                <span class="pull-right">
                    <loader :active="loading"></loader>
                    <a href="{{ route('create-volume') }}?project={{ $project->id }}" class="btn btn-default" title="Create a new volume for this project">Create volume</a>
                    <typeahead :items="attachableVolumes" placeholder="Attach volumes" v-on:select="attachVolume" :clear-on-select="true" title="Attach existing volumes of other projects" v-on:focus="fetchAttachableVolumes"></typeahead>
                </span>
            @endcan
        </div>
        <div class="row">
            <div class="col-sm-4 col-md-3" v-for="volume in filteredVolumes" v-bind:key="volume.id" v-cloak>
                <a v-bind:href="'{{route('volume', '')}}/'+volume.id" v-bind:title="'Show volume '+volume.name">
                    <preview-thumbnail class="preview-thumbnail--projects" v-bind:id="volume.id" :thumb-uris="volume.thumbnailsUrl" @can('update', $project) v-bind:removable="true" v-bind:remove-title="'Detach volume '+volume.name" v-on:remove="removeVolume" @endcan :icon="volume.icon">
                        <img v-bind:src="volume.thumbnailUrl" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
                        <figcaption slot="caption" v-text="volume.name"></figcaption>
                    </preview-thumbnail>
                </a>
            </div>
        </div>
        <div v-if="hasNoMatchingVolumes" v-cloak class="well volume-info-well">
            No volume matches this filter query. <a href="#" v-on:click="clearFiltering">Clear filter query.</a>
        </div>
        <div v-if="!hasVolumes" v-cloak class="well volume-info-well">
            This project has no volumes.
            @can('update', $project)
                <a href="{{ route('create-volume') }}?project={{ $project->id }}" title="Create a new volume">Create the first volume.</a>
            @endcan
        </div>
    </div>
</div>
@endsection
