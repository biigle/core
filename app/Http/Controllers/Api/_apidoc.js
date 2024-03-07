// Global definitions for the apiDoc REST API documentation generator.

/**
 * @apiDefine user Authenticated user
 * The user needs to be authenticated.
 */

/**
 * @apiDefine editor Authenticated editor
 * The user needs to be authenticated with the editor role.
 */

/**
 * @apiDefine admin Authenticated admin
 * The user needs to be global admin.
 */

/**
 * @apiDefine projectMember Project member
 * The authenticated user needs to be member of a project containing this element.
 */

/**
 * @apiDefine projectEditor Project editor
 * The authenticated user needs to be editor or admin of a project containing this element.
 */

/**
 * @apiDefine projectAdmin Project admin
 * The authenticated user needs to be admin of the project.
 */

/**
 * @apiDefine labelTreeMemberIfPrivate Label tree member
 * The authenticated user needs to be editor or admin of the label tree if the label tree is private.
 */

/**
 * @apiDefine labelTreeEditor Label tree editor
 * The authenticated user needs to be editor or admin of the label tree.
 */

/**
 * @apiDefine labelTreeAdmin Label tree admin
 * The authenticated user needs to be admin of the label tree.
 */

/**
 * @apiDefine federatedSearchInstance Federated search instance
 * The request must provide an authentication token of a remote instance configured for
 * federated search.
 */

/**
 * @apiDefine projectAdminAndPendingVolumeOwner Project admin and pending volume owner
 * The authenticated user must be admin of the project and creator of the pending volume.
 */
