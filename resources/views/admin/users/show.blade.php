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
                <div class="panel-body">
                    @if ($creatorCount > 0)
                        Created <strong>{{$creatorCount}}</strong> {{$creatorCount === 1 ? 'project' : 'projects'}} ({{$creatorPercent}} %).
                    @else
                        Created no projects yet.
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
                <div class="panel-body">
                    @if ($memberCount > 0)
                        Is member in <strong>{{$memberCount}}</strong> {{$memberCount === 1 ? 'project' : 'projects'}} ({{$memberPercent}} %).
                    @else
                        Is member on no projects.
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
        <div class="panel-body">
            @if ($volumesCount > 0)
                Created <strong>{{$volumesCount}}</strong> {{$volumesCount === 1 ? 'volume' : 'volumes'}} ({{ $volumesPercent}} %)
                @if ($imagesCount > 0)
                    which {{$volumesCount === 1 ? 'contains' : 'contain'}} <strong>{{$imagesCount}}</strong> {{$imagesCount === 1 ? 'image' : 'images'}} ({{ $imagesPercent }} %).
                @else
                    which {{$volumesCount === 1 ? 'contains' : 'contain'}} no images.
                @endif
            @else
                Created no volumes yet.
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
        <div class="panel-body">
            @if ($totalAnnotationLabels > 0)
                Attached <strong>{{ $totalAnnotationLabels }}</strong> {{ Str::plural('label', $totalAnnotationLabels) }} ({{ round($relativeAnnotationLabels * 100, 2)}}&nbsp;%) to <strong>{{ $totalAnnotations }}</strong> image {{ Str::plural('annotation', $totalAnnotations) }} ({{ round($relativeAnnotations * 100, 2) }}&nbsp;%). That's an average of {{ $labelsPerAnnotation }} {{ Str::plural('label', $labelsPerAnnotation) }} per annotation. Recent annotations:
            @else
                Created no image annotations yet.
            @endif
        </div>
        <ul class="list-group user-stats-list-group">
            @foreach ($recentAnnotations as $annotation)
                <li class="list-group-item">{{ $annotation->created_at }} (<a href="{{ route('show-annotation', $annotation->id) }}">#{{ $annotation->id }}</a>)</li>
            @endforeach
        </ul>
    </div>
</div>

<div class="col-xs-6">
    <div class="panel panel-default">
        <div class="panel-body">
            @if ($totalVideoAnnotationLabels > 0)
                Attached <strong>{{ $totalVideoAnnotationLabels }}</strong> {{ Str::plural('label', $totalVideoAnnotationLabels) }} ({{ round($relativeVideoAnnotationLabels * 100, 2)}}&nbsp;%) to <strong>{{ $totalVideoAnnotations }}</strong> video {{ Str::plural('annotation', $totalVideoAnnotations) }} ({{ round($relativeVideoAnnotations * 100, 2) }}&nbsp;%).
            @else
                Created no video annotations yet.
            @endif
        </div>
    </div>
</div>


@mixin('adminShowUser')
@endsection
