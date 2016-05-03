@extends('app')
@inject('modules', 'Dias\Services\Modules')

@push('styles')
<link href="{{ asset('assets/styles/admin.css') }}" rel="stylesheet">
@endpush

@push('scripts')
<script src="{{ asset('assets/scripts/admin.js') }}"></script>
@endpush

@section('content')
<div class="container" data-ng-app="dias.admin">
    <div class="row">
        <div class="col-sm-4 col-md-3 col-lg-2">
            <ul class="nav nav-pills nav-stacked">
                <li role="presentation"@if(Request::is('admin')) class="active" @endif><a href="{{route('admin')}}">Dashboard</a></li>
                <li role="presentation"@if(Request::is('admin/users')) class="active" @endif><a href="{{route('admin-users')}}">Users</a></li>
                <li role="presentation"@if(Request::is('admin/labels')) class="active" @endif><a href="{{route('admin-labels')}}">Labels</a></li>
                @foreach ($modules->getMixins('adminMenu') as $module => $nestedMixins)
                    @include($module.'::adminMenu', array('mixins' => $nestedMixins))
                @endforeach
            </ul>
        </div>
        <div class="col-sm-8 col-md-9 col-lg-10">
            @yield('admin-content')
        </div>
    </div>
</div>
@endsection
