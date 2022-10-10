@extends('app')

@section('title', 'Dashboard')

@push('styles')
    @mixin('dashboardStyles')
@endpush

@push('scripts')
    @mixin('dashboardScripts')
@endpush

@section('content')
<div class="container">
    @if (session('welcomeMessage'))
        <div class="row">
            <div class="col-xs-12">
                <p class="text-success text-center lead">
                    Welcome to BIIGLE! Take a look around and make yourself at home.
                </p>
            </div>
        </div>
    @endif
    @if (config('biigle.user_registration_confirmation') && $user->role_id === \Biigle\Role::guestId())
        <div class="row">
            <div class="col-xs-12">
                    <p class="text-info text-center">
                        You will be able to create new projects and label trees once an admin has accepted your sign up.
                    </p>
            </div>
        </div>
    @endif
    <div class="row">
        <div class="col-xs-12">
            <div class="pull-right">
                <a href="{{url('manual')}}" class="btn btn-default" title="View the user manual">
                    <i class="fa fa-book"></i> View Manual
                </a>

                @can('create', \Biigle\Project::class)
                    <a href="{{route('projects-create')}}" class="btn btn-default" title="Create a new project">
                        <i class="fa fa-folder"></i> Create Project
                    </a>
                @else
                    <button class="btn btn-default" title="Guests are not allowed to create new projects" disabled>
                        <i class="fa fa-folder"></i> Create Project
                    </button>
                @endcan
                @can('create', \Biigle\LabelTree::class)
                    <a href="{{route('label-trees-create')}}" class="btn btn-default" title="Create a new label tree">
                        <i class="fa fa-tags"></i> Create Label Tree
                    </a>
                @else
                    <button class="btn btn-default" title="Guests are not allowed to create new label trees" disabled>
                        <i class="fa fa-tags"></i> Create Label Tree
                    </button>
                @endcan

                @mixin('dashboardButtons')
            </div>
            @if ($activityItems->isNotEmpty())
                <div class="lead">
                    Your recent activity
                </div>
            @else
                <div class="lead text-muted">
                    No recent activity
                </div>
            @endif
        </div>
    </div>
    @if ($activityItems->isNotEmpty())
        <div class="row activity-items">
            <div class="col-xs-12">
                <div class="well well-sm">
                    <div class="row">
                        @foreach ($activityItems as $item)
                            <div class="col-xs-6 col-md-3">
                                @include($item['include'], $item)
                            </div>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>
    @endif
    @if ($projects->isNotEmpty())
        <div class="dashboard-projects" id="projects-dashboard-main">
            @foreach ($projects as $project)
               <div class="row dashboard-project">

                    <h4 class="col-xs-12">
                        @if ($project->pivot->pinned)
                            <i class="fa fa-thumbtack text-muted" title="This project has been pinned to the dashboard"></i>
                        @endif
                        <a href="{{route('project', $project->id)}}" title="Show project {{$project->name}}">
                            {{$project->name}}
                        </a>
                    </h4>

                    <?php
                        $volumes = $project->volumes()
                            ->orderBy('created_at', 'desc')
                            ->limit(4)
                            ->get();
                    ?>
                    @forelse ($volumes as $item)
                        <div class="col-xs-12 col-sm-6 col-md-3">
                            @include('projects.partials.dashboardPreviewItem')
                        </div>
                    @empty
                        <div class="col-xs-12">
                            <div class="text-muted">
                                This project is empty.
                            </div>
                        </div>
                    @endforelse

                </div>
            @endforeach
        </div>
        <div class="row">
            <div class="col-xs-12 dashboard__all-projects">
                <a href="{{route('search', ['t' => 'projects'])}}" class="btn btn-default btn-lg" title="Show all projects">Show all projects</a>
            </div>
        </div>
    @else
        <div class="row">
            <div class="col-md-8 col-md-offset-2">
                <div class="text-info text-center well">
                    You do not belong to any projects yet.<br>You can @can ('create', Biigle\Project::class) <a href="{{route('projects-create')}}">create your own project</a> or @endcan request a project admin to add you to a project.
                </div>
            </div>
        </div>
    @endif

    @mixin('dashboardMain')
</div>
@endsection
