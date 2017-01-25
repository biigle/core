@extends('admin.base')

@section('title'){{$file}}.log @stop

@section('admin-content')
    <h1>{{$file}}.log</h1>
    <pre>{{$content}}</pre>
@endsection
