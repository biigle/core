@extends('errors.base')

@section('title') Not Found @endsection

@section('error-content')
<h2 class="col-sm-offset-3 col-sm-6">
    <span class="glyphicon glyphicon-search" aria-hidden="true"></span> Not Found
</h2>
<p class="col-sm-offset-3 col-sm-6 alert alert-danger">
    We could not find what you are looking for, sorry.
</p>
<div class="col-sm-offset-3 col-sm-6 clearfix">
    <a href="{{URL::previous()}}" class="">Go back</a>
</div>
@endsection
