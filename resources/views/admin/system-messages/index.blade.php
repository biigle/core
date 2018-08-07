@extends('admin.base')

@section('title', 'System messages admin area')

@section('admin-content')
<a href="{{route('admin-system-messages-new')}}" class="btn btn-default" title="Create a new system message"><span class="fa fa-bullhorn" aria-hidden="true"></span> New system message</a>

<table class="table table-hover">
    <thead>
        <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Published</th>
            <th></th>
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
                <td><a href="{{route('admin-system-messages-edit', $message->id)}}" class="btn btn-default btn-xs pull-right" title="Edit this system message"><span class="fa fa-pencil-alt" aria-hidden="true"></a></td>
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
