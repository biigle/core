@extends('admin.base')
@inject('modules', 'Dias\Services\Modules')

@section('title')Admin area @stop

@section('admin-content')
    <div class="col-sm-6">
        <div class="panel panel-default">
            <div class="panel-heading">
                <a href="{{route('admin-users')}}" title="Users"><h3 class="panel-title">Users</h3></a>
            </div>
            <div class="panel-body">
                <p class="h1 text-center">{{ Dias\User::count() }}</p>
            </div>
        </div>
    </div>
    @foreach ($modules->getMixins('adminIndex') as $module => $nestedMixins)
        <div class="col-sm-6">
            @include($module.'::adminIndex')
        </div>
    @endforeach
@endsection
