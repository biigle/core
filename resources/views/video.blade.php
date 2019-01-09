@extends('app')

@section('title', $video->name)

@section('content')
<video src="{{url('api/v1/videos/'.$video->uuid.'/file')}}" controls width="500"></video>
@endsection
