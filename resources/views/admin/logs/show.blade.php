@extends('admin.base')

@section('title', $file.'.log')

@section('admin-content')
    <h1>{{$file}}.log</h1>
    <pre>{{$content}}</pre>
@endsection
