@extends('admin.base')

@section('title')Volumes admin area @stop

@section('admin-content')
<table class="table">
    <thead>
        <tr>
            <th>Name</th>
            <th>Projects</th>
            <th>Last update</th>
        </tr>
    </thead>
    <tbody>
         @foreach ($volumes as $volume)
            <tr>
                <td><a href="{{route('volume', $volume->id)}}" title="Show {{ $volume->name }}">{{$volume->name}}</a></td>
                <td>
                    @if ($volume->projects->count() === 1)
                        <a href="{{route('project', $volume->projects[0]->id)}}" title="Show {{ $volume->projects[0]->name }}">{{$volume->projects[0]->name}}</a>
                    @else
                        <div class="dropdown">
                            <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">{{$volume->projects->count()}} Projects <span class="caret"></span></a>
                            <ul class="dropdown-menu">
                                @foreach ($volume->projects as $project)
                                    <li><a href="{{route('project', $project->id)}}" title="Show {{ $project->name }}">{{$project->name}}</a></li>
                                @endforeach
                            </ul>
                        </div>
                    @endif
                </td>
                <td>{{$volume->updated_at}}</td>
            </tr>
        @endforeach
    </tbody>
</table>
@endsection
