@extends('errors::layout')

@section('title', 'Internal Server Error')

@section('message')
This is not supposed to happen. You probably just discovered a bug.<br><br>
Please notify the <a href="mailto:{{config('biigle.admin_email')}}">BIIGLE administrators</a> with the exact steps to reproduce this error.
@endsection
