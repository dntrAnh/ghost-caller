export interface GroupSessionMember {
  id: string;
  name: string;
  role: 'host' | 'member';
  joinedLabel: string;
  status: 'active' | 'reviewing' | 'invited';
  isCurrentUser?: boolean;
}

export interface GroupSession {
  id: string;
  name: string;
  hostName: string;
  invitedBy: string;
  createdLabel: string;
  statusLabel: string;
  members: GroupSessionMember[];
}
