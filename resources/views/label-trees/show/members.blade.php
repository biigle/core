@extends('label-trees.show.base')

@push('scripts')
<script type="text/javascript">
    biigle.$declare('labelTrees.members', {!! $members !!});
    biigle.$declare('labelTrees.roles', {!! $roles !!});
    biigle.$declare('labelTrees.defaultRoleId', {!! Biigle\Role::editorId() !!});
</script>
@endpush

@section('label-tree-content')
<div class="row">
    <div class="col-md-6">
        @include('label-trees.show.members-panel')
    </div>
</div>
@endsection
