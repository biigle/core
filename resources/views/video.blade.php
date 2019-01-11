@extends('app')

@section('title', $video->name)

@section('content')
<div id="video-container" class="video-container">
    <video-screen ref="videoScreen" src="{{url('api/v1/videos/'.$video->uuid.'/file')}}"></video-screen>
    {{-- <video controls muted="true"></video> --}}
    <div class="video-timeline">
        <button class="btn btn-default" v-on:click="play">Play</button>
        <button class="btn btn-default" v-on:click="pause">Pause</button>
    </div>
</div>
@endsection

@push('scripts')
<script src="{{ cachebust_asset('assets/scripts/ol.js') }}"></script>
@endpush

@push('styles')
<link rel="stylesheet" type="text/css" href="{{ cachebust_asset('assets/styles/ol.css') }}">
@endpush
