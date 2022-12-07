@extends('admin.base')

@section('title', 'Announcements admin area')

@section('admin-content')

@if($hasActive)
    <button class="btn btn-default" disabled title="Another announcement is already active"><span class="fa fa-bullhorn"></span> New announcement</button>
@else
    <a href="{{route('admin-announcements-new')}}" class="btn btn-default" title="Create a new announcement"><span class="fa fa-bullhorn"></span> New announcement</a>
@endif

<table class="table table-hover">
    <thead>
        <tr>
            <th>Title</th>
            <th>Show until</th>
            <th></th>
        </tr>
    </thead>
    <tbody>
        @forelse ($announcements as $announcement)
            <tr>
                <td>
                    {{$announcement->title}}
                </td>
                @if (is_null($announcement->show_until))
                    <td class="text-muted">indefinite</td>
                @else
                    <td>{{$announcement->show_until}}</td>
                @endif
                <td>
                    <form class="form-inline-block" method="POST" action="{{url('api/v1/announcements', $announcement->id)}}" onsubmit="return confirm('Do you really want to delete this announcement?');">
                        <input type="hidden" name="_token" value="{{ csrf_token() }}">
                        <input type="hidden" name="_method" value="DELETE">
                        <button type="submit" class="btn btn-default btn-xs" title="Delete this announcement"><i class="fa fa-trash-alt"></i></button>
                    </form>
                </td>
            </tr>
        @empty
            <tr>
                <td colspan="3" class="text-muted">
                    There are no announcements yet. @unless($hasActive) <a href="{{route('admin-announcements-new')}}">Create a new one.</a> @endunless
                </td>
            </tr>
        @endforelse
    </tbody>
</table>
<nav class="text-center">
    {{$announcements->links()}}
</nav>
@endsection
