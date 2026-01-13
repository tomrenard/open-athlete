export interface Profile {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  stravaAthleteId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileInsert {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  stravaAthleteId?: number;
}

export interface ProfileUpdate {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
}

export interface ProfileWithStats extends Profile {
  followersCount: number;
  followingCount: number;
  activitiesCount: number;
}

export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface FollowWithProfile extends Follow {
  profile: Profile;
}
