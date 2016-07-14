@extends('errors.base')

@section('title') Unauthorized @endsection

@section('error-content')
<h2 class="col-sm-offset-3 col-sm-6">
    <span class="glyphicon glyphicon-lock" aria-hidden="true"></span> Unauthorized
</h2>
<p class="col-sm-offset-3 col-sm-6 alert alert-danger">
    You are not authorized to see the resource you just requested.
</p>
<div class="col-sm-offset-3 col-sm-6 clearfix">
    @if (auth()->check())
        <a href="{{route('home')}}" class="pull-right">Go to dashboard</a>
    @endif
    <a href="{{URL::previous()}}" class="">Go back</a>
</div>
@endsection
