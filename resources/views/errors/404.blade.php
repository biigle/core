@extends('errors::layout')

@section('title', 'Not Found')

@section('type', 'warning')

@section('message')
The content you are trying to access has been eaten.<br><br>
<img src="{{asset('assets/images/404.webp')}}"></img>
<br>
<a href="{{URL::previous()}}">Go back.</a>
@endsection