<?php $user = Auth::user() ?>

<h2 class="clearfix">Projects <a href="{{ route('create-project') }}" class="btn btn-default pull-right" title="Create a new project">New Project</a></h2>

<div class="row">
    @forelse($user->projects as $project)
        <div class="col-lg-6">
            <div class="panel panel-default">
                <div class="panel-heading">
                    <a href="{{ route('project', $project->id) }}" title="Show {{ $project->name }}"><h3 class="panel-title">{{ $project->name }}</h3></a>
                </div>
                <div class="panel-body">
                    @foreach ($mixins as $module => $nestedMixins)
                        @include($module.'::dashboard.projects', array('mixins' => $nestedMixins, 'project' => $project))
                    @endforeach
                </div>
            </div>
        </div>
    @empty
        <div class="alert alert-info">
            You do not belong to any projects yet. Try <a href="{{ route('create-project') }}" class="alert-link">creating</a> one.
        </div>
    @endforelse
</div>
