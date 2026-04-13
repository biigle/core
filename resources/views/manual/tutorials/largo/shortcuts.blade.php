@extends('manual.base')

@section('manual-title', 'Shortcuts')

@section('manual-content')
    <div class="row">
        <p class="lead">
            A list of all available shortcut keys in Largo.
        </p>

        <table class="table">
            <thead>
                <tr>
                    <th>Key</th>
                    <th>Function</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><kbd>a</kbd></td>
                    <td>Sort annotation patches by unusual objects</td>
                </tr>
                <tr>
                    <td><kbd>s</kbd></td>
                    <td>Sort annotation patches by similarity</td>
                </tr>
                <tr>
                    <td><kbd>o</kbd></td>
                    <td>Hide the annotation outlines</td>
                </tr>
            </tbody>
        </table>
    </div>
@endsection
