@extends('errors.base')

@section('title', 'Internal Server Error')

@section('error-content')
<h2 class="col-sm-offset-3 col-sm-6">
    <span class="glyphicon glyphicon-alert" aria-hidden="true"></span> Internal Server Error
</h2>
<p class="col-sm-offset-3 col-sm-6 alert alert-danger">
    This is not supposed to happen. You probably just discovered a bug. Please notify the <a href="mailto:{{config('biigle.admin_email')}}">BIIGLE administrators</a> with the exact steps to reproduce this error.
</p>
<div class="col-sm-offset-3 col-sm-6 clearfix">
    @if (auth()->check())
        <a href="{{route('home')}}" class="pull-right">Go to the dashboard</a>
    @endif
    <a href="{{URL::previous()}}" class="">Go back</a>
</div>
@endsection
