import type { ClubActivity } from './types';

function hashId(id: string): number {
  return Array.from(id).reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 3), 0);
}

function capacityFromPeople(people: string): number {
  const values = people.match(/\d+/g)?.map((value) => Number.parseInt(value, 10)).filter(Number.isFinite) ?? [];
  return values.length ? Math.max(...values) : 8;
}

export function getClubActivityCapacity(activity: ClubActivity): number {
  return capacityFromPeople(activity.people);
}

export function getClubActivityStats(activity: ClubActivity, joined = false) {
  const seed = hashId(activity.id);
  const capacity = capacityFromPeople(activity.people);
  const baseJoined = Math.max(2, Math.min(capacity, 2 + (seed % Math.max(3, capacity))));
  const joinedCount = Math.min(capacity, baseJoined + (joined ? 1 : 0));
  const views = Math.max(joinedCount * 8 + 15, 47 + (seed % 220));

  return {
    views,
    joined: joinedCount,
    capacity,
    isFull: activity.status !== '预活动' && joinedCount >= capacity,
  };
}
