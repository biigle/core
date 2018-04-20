@extends('errors::layout')

@section('title', 'Page Expired')

@section('message')
The page has expired due to inactivity.<br><br>
Please go <a href="{{URL::previous()}}">back</a> and try again.
@endsection
