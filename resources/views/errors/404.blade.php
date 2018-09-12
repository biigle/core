@extends('errors::layout')

@section('title', 'Not Found')

@section('type', 'warning')

@section('message')
We could not find what you are looking for, sorry. <a href="{{URL::previous()}}">Go back.</a>
@endsection
