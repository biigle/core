@extends('admin.base')

@section('title')Transects admin area @stop

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
         @foreach ($transects as $transect)
            <tr>
                <td><a href="{{route('transect', $transect->id)}}" title="Show {{ $transect->name }}">{{$transect->name}}</a></td>
                <td>
                    @if ($transect->projects->count() === 1)
                        <a href="{{route('project', $transect->projects[0]->id)}}" title="Show {{ $transect->projects[0]->name }}">{{$transect->projects[0]->name}}</a>
                    @else
                        <div class="dropdown">
                            <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">{{$transect->projects->count()}} Projects <span class="caret"></span></a>
                            <ul class="dropdown-menu">
                                @foreach ($transect->projects as $project)
                                    <li><a href="{{route('project', $project->id)}}" title="Show {{ $project->name }}">{{$project->name}}</a></li>
                                @endforeach
                            </ul>
                        </div>
                    @endif
                </td>
                <td>{{$transect->updated_at}}</td>
            </tr>
        @endforeach
    </tbody>
</table>
@endsection
