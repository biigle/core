<template>
    <li class="list-group-item invitation-list-item">
        <h4 class="list-group-item-heading">
            <span :class="classObject">
                Invitation
            </span>
            <small v-if="expired">
                (expired)
            </small>
            <small v-else>
                (valid for <span :title="expiresDateTitle" v-text="invitation.expires_at_for_humans"></span>)
            </small>
            <span class="pull-right invitation-list-buttons">
                <!-- <button
                    class="btn btn-sm btn-default"
                    title="Copy link to clipboard"
                    @click="handleCopyLink"
                    disabled
                    >
                    <i class="fa fa-link"></i>
                </button> -->
                <button
                    class="btn btn-sm btn-default"
                    title="Show QR code"
                    @click="handleShowQrCode"
                    >
                    <i class="fa fa-qrcode"></i>
                </button>
                <button
                    class="btn btn-sm btn-default"
                    title="Delete invitation"
                    @click="handleDelete"
                    >
                    <i class="fa fa-trash"></i>
                </button>
            </span>
        </h4>
        <p class="list-group-item-text text-muted">
            Role: <span v-text="role.name"></span>.
            <span>
                Used: <span v-text="uses"></span><span v-if="invitation.max_uses"> of <span v-text="invitation.max_uses"></span></span> times.
            </span>
        </p>
    </li>
</template>

<script>
export default {
    props: {
        invitation: {
            type: Object,
            required: true,
        },
        roles: {
            type: Array,
            required: true,
        },
        baseUrl: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            //
        };
    },
    computed: {
        role() {
            return this.roles.find((role) => {
                return this.invitation.role_id === role.id;
            });
        },
        uses() {
            // current_uses can be undefined if the invitation was just created.
            return this.invitation.current_uses || 0;
        },
        expired() {
            let expiresDate = new Date(this.invitation.expires_at);
            let now = new Date();

            return expiresDate < now || (this.invitation.max_uses && this.invitation.current_uses >= this.invitation.max_uses);
        },
        classObject() {
            return {
                'text-muted': this.expired,
            };
        },
        expiresDateTitle() {
            let date = new Date(this.invitation.expires_at);

            return `Expires on ${date.toDateString()}`;
        },
        link() {
            return `${this.baseUrl}/${this.invitation.uuid}`;
        },
    },
    methods: {
        handleCopyLink() {
            // navigator.permissions.query({name: "clipboard-rite"}).then((result) => {
            //     if (result.state === "granted" || result.state === "prompt") {
            //         navigator.clipboard.writeText(this.link).then(() => {
            //            /* clipboard successfully set */
            //         }, () => {
            //             /* clipboard write failed */
            //         });
            //     }
            // });
        },
        handleShowQrCode() {
            this.$emit('show', this.invitation);
        },
        handleDelete() {
            this.$emit('delete', this.invitation.id);
        },
    },
};
</script>
