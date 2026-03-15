import type { GroupSession } from '@/types/group-session';

export const mockGroupSession: GroupSession = {
  id: 'NYC-7Q2P',
  name: "Gwen's Group",
  hostName: 'Gwen',
  invitedBy: 'Gwen',
  createdLabel: 'Created 18 minutes ago',
  statusLabel: '4 members active',
  members: [
    { id: 'gwen', name: 'Gwen', role: 'host', joinedLabel: 'Host', status: 'active' },
    { id: 'you', name: 'You', role: 'member', joinedLabel: 'You joined', status: 'active', isCurrentUser: true },
    { id: 'maya', name: 'Maya', role: 'member', joinedLabel: 'Reviewing brunch options', status: 'reviewing' },
    { id: 'ethan', name: 'Ethan', role: 'member', joinedLabel: 'Added dinner preferences', status: 'active' },
  ],
};
