@extends('admin.base')

@section('title', "{$shownUser->firstname} {$shownUser->lastname} - User Information")

@section('admin-content')
<h2 class="col-xs-12 no-margin">
    @if ($user->id !== $shownUser->id)
        <a class="btn btn-default pull-right" href="{{route('admin-users-edit', $shownUser->id)}}" title="Edit {{$shownUser->firstname}} {{$shownUser->lastname}}">Edit</a>
    @endif
    {{$shownUser->firstname}} {{$shownUser->lastname}}
    <small>
        {{$shownUser->email}}
        <span class="label label-{{$roleClass}}">{{ucfirst($shownUser->role->name)}}</span>
    </small>
</h2>
<p class="col-xs-12 clearfix">
    <code class="pull-right">{{$shownUser->uuid}}</code>
    @if ($shownUser->affiliation)
        {{$shownUser->affiliation}}<br>
    @endif
    <span class="text-muted">
        @if ($shownUser->login_at)
            <span title="{{$shownUser->login_at}}">active {{$shownUser->login_at->diffForHumans()}}</span>
        @else
            never logged in
        @endif
    </span>
</p>

<div class="col-xs-12">
    <div class="row">
        <div class="col-xs-6">
            <div class="panel panel-default">
                <div class="panel-heading">
                    @if ($creatorCount > 0)
                        Created <strong>{{$creatorCount}}</strong> {{$creatorCount === 1 ? 'project' : 'projects'}} ({{$creatorPercent}}%).
                    @else
                        Created no projects.
                    @endif
                </div>
                <ul class="list-group user-stats-list-group">
                    @foreach ($creatorProjects as $project)
                        <li class="list-group-item"><a href="{{route('project', $project->id)}}">{{$project->name}}</a></li>
                    @endforeach
                </ul>
            </div>
        </div>
        <div class="col-xs-6">
            <div class="panel panel-default">
                <div class="panel-heading">
                    @if ($memberCount > 0)
                        Member of <strong>{{$memberCount}}</strong> {{$memberCount === 1 ? 'project' : 'projects'}} ({{$memberPercent}}%).
                    @else
                        No member of any project.
                    @endif
                </div>
                <ul class="list-group user-stats-list-group">
                    @foreach ($memberProjects as $project)
                        <li class="list-group-item"><a href="{{route('project', $project->id)}}">{{$project->name}}</a></li>
                    @endforeach
                </ul>
            </div>
        </div>
    </div>
</div>

<div class="col-xs-6">
    <div class="panel panel-default">
        <div class="panel-heading">
            @if ($volumesCount > 0)
                Created <strong>{{$volumesCount}}</strong> {{$volumesCount === 1 ? 'volume' : 'volumes'}} ({{ $volumesPercent}}%)
                @if ($imagesCount > 0)
                    with <strong>{{$imagesCount}}</strong> image(s) ({{ $imagesPercent }}%).
                @else
                    with no images.
                @endif
            @else
                Created no volumes.
            @endif
        </div>
        <ul class="list-group user-stats-list-group">
            @foreach ($volumes as $volume)
                <li class="list-group-item"><a href="{{route('volume', $volume->id)}}">{{$volume->name}}</a></li>
            @endforeach
        </ul>
    </div>
</div>

<div class="col-xs-6">
    <div class="panel panel-default">
        <div class="panel-heading">
            @if ($totalAnnotations > 0)
                Created <strong>{{ $totalAnnotations }}</strong> image {{ Str::plural('annotation', $totalAnnotations) }} ({{ round($relativeAnnotations * 100, 2) }}%). Recently:
            @else
                Created no image annotations.
            @endif
        </div>
        <ul class="list-group user-stats-list-group">
            @foreach ($recentImageAnnotations as $annotation)
                <li class="list-group-item">{{ $annotation->created_at }} (<a href="{{ route('show-image-annotation', $annotation->id) }}">#{{ $annotation->id }}</a>)</li>
            @endforeach
        </ul>
    </div>
</div>

<div class="col-xs-6">
    <div class="panel panel-default">
        <div class="panel-heading">
            @if ($totalVideoAnnotations > 0)
                Created <strong>{{ $totalVideoAnnotations }}</strong> video {{ Str::plural('annotation', $totalVideoAnnotations) }} ({{ round($relativeVideoAnnotations * 100, 2) }}%). Recently:
            @else
                Created no video annotations.
            @endif
        </div>
        <ul class="list-group user-stats-list-group">
            @foreach ($recentVideoAnnotations as $annotation)
                <li class="list-group-item">{{ $annotation->created_at }} (<a href="{{ route('show-video-annotation', $annotation->id) }}">#{{ $annotation->id }}</a>)</li>
            @endforeach
        </ul>
    </div>
</div>


@mixin('adminShowUser')
@endsection
