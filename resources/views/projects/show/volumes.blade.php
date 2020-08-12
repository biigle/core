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
            <a href="{{route('project', $project->id)}}"><i class="fa fa-folder"></i> Volumes <span class="badge">{{readable_number($project->volumes()->count())}}</span></a>
        </li>
        <li role="presentation">
            <a href="#"><i class="fa fa-tags"></i> Label Trees <span class="badge">{{readable_number($project->labelTrees()->count())}}</span></a>
        </li>
        <li role="presentation">
            <a href="#"><i class="fa fa-users"></i> Members <span class="badge">{{readable_number($project->users()->count())}}</span></a>
        </li>
        @mixin('projectsShowV2Tabs')
    </ul>
    <div id="projects-show-volumes">
        <div class="row">
            <div class="col-xs-12">
                <form v-if="hasVolumes" class="form-inline" :class="filterInputClass">
                    <span class="form-group has-feedback">
                        <input class="form-control" type="text" name="filter" placeholder="Filter volumes" v-model="filterString" v-on:keyup.esc="clearFiltering">
                        <span v-cloak v-show="hasFiltering" v-on:click="clearFiltering" title="Clear filtering" class="form-control-feedback" aria-hidden="true"><i class="fas fa-times fa-sm"></i></span>
                    </span>
                </form>
                @can('update', $project)
                    <a href="{{ route('create-volume') }}?project={{ $project->id }}" class="btn btn-default" title="Create a new volume">Create volume</a>
                    {{-- <button class="btn btn-default btn-xs" title="Edit volumes" v-cloak v-on:click="toggleEditing"><span class="fa fa-pencil-alt" aria-hidden="true"></span></button> --}}
                    <button class="btn btn-default">Attach volumes</button>
                    <button class="btn btn-default">Detach/delete volumes</button>
                @endcan
            </div>
        </div>
        <div class="row">
            <div class="col-sm-4 col-md-3" v-for="volume in filteredVolumes" v-bind:key="volume.id" v-cloak>
                <a v-bind:href="'{{route('volume', '')}}/'+volume.id" v-bind:title="'Show volume '+volume.name">
                    <preview-thumbnail class="preview-thumbnail--projects" v-bind:id="volume.id" :thumb-uris="volume.thumbnailsUrl" @can('update', $project) v-bind:removable="editing" v-bind:remove-title="'Detach volume '+volume.name" @endcan v-on:remove="removeVolume" :icon="volume.icon">
                        <img v-bind:src="volume.thumbnailUrl" onerror="this.src='{{ asset(config('thumbnails.empty_url')) }}'">
                        <figcaption slot="caption" v-text="volume.name"></figcaption>
                    </preview-thumbnail>
                </a>
            </div>
        </div>
        <span class="text-muted" v-if="hasNoMatchingVolumes" v-cloak>No volume matches this query.</span>
        <span class="text-muted" v-if="!hasVolumes" v-cloak>This project has no volumes.</span>
    </div>
</div>
@endsection
