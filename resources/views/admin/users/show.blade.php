@extends('admin.base')
@inject('modules', 'Biigle\Services\Modules')

@section('title', "Users admin area - {$shownUser->firstname}, {$shownUser->lastname}")

@section('admin-content')
<h2 class="col-xs-12 no-margin">
    <span class="pull-right label label-{{$roleClass}}">{{ucfirst($shownUser->role->name)}}</span>
    {{$shownUser->firstname}} {{$shownUser->lastname}} <small>{{$shownUser->email}}</small>
</h2>
<p class="col-xs-12 text-muted">
    @if ($shownUser->login_at)
        <span title="{{$shownUser->login_at}}">active {{$shownUser->login_at->diffForHumans()}}</span>
    @else
        never logged in
    @endif
</p>

@foreach ($modules->getMixins('adminShowUser') as $module => $nestedMixins)
    @include($module.'::adminShowUser')
@endforeach
@endsection
