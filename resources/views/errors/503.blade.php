@extends('errors.base')

@section('title') Service Unavailable @endsection

@section('error-content')
<h2 class="col-sm-offset-3 col-sm-6">
    <span class="glyphicon glyphicon-wrench" aria-hidden="true"></span> Service Unavailable
</h2>
<p class="col-sm-offset-3 col-sm-6 alert alert-warning">
    BIIGLE is in maintenance mode and currently unavailable. Please come back later.
</p>
@endsection
