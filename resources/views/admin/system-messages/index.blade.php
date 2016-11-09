@extends('admin.base')

@section('title')System messages admin area @stop

@section('admin-content')
<a href="{{route('admin-system-messages-new')}}" class="btn btn-default" title="Create a new system message"><span class="glyphicon glyphicon-bullhorn" aria-hidden="true"></span> Create a new system message</a>
@endsection
