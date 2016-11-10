@extends('admin.base')

@section('title')System messages admin area @stop

@section('admin-content')
<a href="{{route('admin-system-messages-new')}}" class="btn btn-default" title="Create a new system message"><span class="glyphicon glyphicon-bullhorn" aria-hidden="true"></span> Create a new system message</a>

<table class="table table-hover">
    <thead>
        <tr>
            <td>Title</td>
            <td>Type</td>
            <td>Published</td>
            <td></td>
        </tr>
    </thead>
    <tbody>
        @forelse ($messages as $message)
            <tr>
                <td>{{$message->title}}</td>
                <td>{{$message->type->name}}</td>
                @if ($message->isPublished())
                    <td>{{$message->published_at}}</td>
                @else
                    <td class="text-muted">draft</td>
                @endif
                <td><a href="{{route('admin-system-messages-edit', $message->id)}}" class="btn btn-default btn-xs pull-right" title="Edit this system message"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></a></td>
            </tr>
        @empty
            <tr>
                <td colspan="3" class="text-muted">
                    There are no system messages yet. <a href="{{route('admin-system-messages-new')}}">Create a new one.</a>
                </td>
            </tr>
        @endforelse
    </tbody>
</table>
@endsection
