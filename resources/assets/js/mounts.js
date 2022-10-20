import AnnouncementContainer from './core/announcements/container';
import AnnouncementsEditForm from './core/announcements/editForm';
import MessagesDisplay from './core/messages/display';
import NotificationsList from './core/notifications/list';
import NotificationsNavbarIndicator from './core/notifications/navbarIndicator';
import NotificationsUnreadCount from './core/notifications/unreadCount';
import TopMenu from './core/topMenu';
import {mount} from './utils';

mount('announcement', AnnouncementContainer);
mount('announcements-edit-form', AnnouncementsEditForm);
mount('messages-display', MessagesDisplay);
mount('notifications-list', NotificationsList);
mount('notifications-navbar-indicator', NotificationsNavbarIndicator);
mount('notifications-unread-count', NotificationsUnreadCount);
mount('top-menu', TopMenu);
