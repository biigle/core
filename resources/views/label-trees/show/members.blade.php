@extends('label-trees.show.base')

@push('scripts')
<script type="text/javascript">
    biigle.$declare('labelTrees.members', {!! $members !!});
    biigle.$declare('labelTrees.roles', {!! $roles !!});
    biigle.$declare('labelTrees.defaultRole', {!! Biigle\Role::editor() !!});
</script>
@endpush

@section('label-tree-content')
<div id="label-trees-members" class="label-tree-members">
    <div class="row">
        <div class="col-xs-6">
            <member-list
                v-if="hasMembers"
                :members="members"
                :own-id="userId"
                :editable="true"
                :roles="roles"
                v-on:remove="removeMember"
                v-on:update="updateMember"
                >
            </member-list>
            <div v-else @if ($members->isNotEmpty()) v-cloak @endif class="panel panel-info">
                <div class="panel-body text-info">
                    This label tree has no members and therefore is a global label tree. Add members to make it an ordinary label tree.
                </div>
            </div>
        </div>
        <div class="col-xs-6">
            <span class="top-bar pull-right">
                <loader :active="loading"></loader>
                <add-member-form
                    class="inline-block-form"
                    :members="members"
                    :roles="roles"
                    :default-role="defaultRole"
                    :disabled="loading"
                    v-on:attach="attachMember"
                    ></add-member-form>
            </span>
        </div>
    </div>
</div>
@endsection
