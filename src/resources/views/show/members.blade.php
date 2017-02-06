<members-panel id="label-trees-members" :members="members" :roles="roles" :default-role="defaultRole" :own-id="userId" :loading="loading" v-on:attach="attachMember" v-on:update="updateMember" v-on:remove="removeMember">
    <span>This tree has no members and therefore is a global label tree.<br>Add members to make it an ordinary label tree.</span>
</members-panel>
