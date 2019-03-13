@extends('admin.base')
@inject('modules', 'Biigle\Services\Modules')

@section('title', 'Admin area')

@section('admin-content')
    <div class="col-sm-6">
        <div class="panel panel-default">
            <div class="panel-heading">
                <h3 class="panel-title">
                    <span class="pull-right">
                        <span title="Users who have been logged in once">{{ $loginUsers }}</span> <span title="All users" class="text-muted">/ {{$allUsers}}</span>
                    </span>
                    <a href="{{route('admin-users')}}" title="Users">Users</a>
                </h3>
            </div>
            <div class="panel-body">
                <p class="h1 text-center">
                    <span title="Active users in the last 24 hours">{{$activeUsersLastDay}}</span> <span class="text-muted">/</span> <span title="Active users in the last week">{{$activeUsersLastWeek}}</span> <span class="text-muted">/</span> <span title="Active users in the last month">{{$activeUsersLastMonth}}</span>
                </p>
            </div>
        </div>
    </div>
    <div class="col-sm-6">
        <div class="panel panel-default">
            <div class="panel-heading">
                <h3 class="panel-title">
                    <span class="pull-right">
                        <span title="Version of the BIIGLE core">{{ config('biigle.version') }}</span>
                    </span>
                    <span title="Version of BIIGLE core and the installed modules">Version</span>
                </h3>
            </div>
            @unless (empty($installedModules))
                <ul class="list-group dashboard-version-list">
                    @foreach ($installedModules as $module)
                        <li class="list-group-item">{{$module['name']}}: {{$module['version']}}</li>
                    @endforeach
                </ul>
            @else
                <div class="panel-body">
                    <p class="h1 text-center text-muted">No modules installed</p>
                </div>
            @endunless
        </div>
    </div>
    @foreach ($modules->getMixins('adminIndex') as $module => $nestedMixins)
        @include($module.'::adminIndex')
    @endforeach
@endsection
