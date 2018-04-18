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
            </div>
        </div>
    </div>
    @foreach ($modules->getMixins('adminIndex') as $module => $nestedMixins)
        <div class="col-sm-6">
            @include($module.'::adminIndex')
        </div>
    @endforeach
@endsection
