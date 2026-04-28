import { openDB, type IDBPDatabase } from 'idb';
import type { CapturedPose, UserProfile, BodyMeasurements } from './types';

const DB_NAME = 'virtual-fitting-room';
const DB_VERSION = 1;

interface FittingRoomDB {
  poses: {
    key: string;
    value: CapturedPose;
  };
  profiles: {
    key: string;
    value: UserProfile;
  };
  measurements: {
    key: string;
    value: BodyMeasurements;
  };
}

async function getDB(): Promise<IDBPDatabase<FittingRoomDB>> {
  return openDB<FittingRoomDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('poses')) {
        db.createObjectStore('poses', { keyPath: 'poseId' });
      }
      if (!db.objectStoreNames.contains('profiles')) {
        db.createObjectStore('profiles', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('measurements')) {
        db.createObjectStore('measurements', { keyPath: 'capturedAt' });
      }
    },
  });
}

export async function savePose(pose: CapturedPose): Promise<void> {
  const db = await getDB();
  await db.put('poses', pose);
}

export async function getPose(poseId: string): Promise<CapturedPose | undefined> {
  const db = await getDB();
  return db.get('poses', poseId);
}

export async function getAllPoses(): Promise<CapturedPose[]> {
  const db = await getDB();
  return db.getAll('poses');
}

export async function deletePose(poseId: string): Promise<void> {
  const db = await getDB();
  await db.delete('poses', poseId);
}

export async function clearAllPoses(): Promise<void> {
  const db = await getDB();
  await db.clear('poses');
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const db = await getDB();
  await db.put('profiles', profile);
}

export async function getProfile(id: string): Promise<UserProfile | undefined> {
  const db = await getDB();
  return db.get('profiles', id);
}

export async function getLatestProfile(): Promise<UserProfile | undefined> {
  const db = await getDB();
  const profiles = await db.getAll('profiles');
  if (profiles.length === 0) return undefined;
  return profiles.reduce((latest, profile) =>
    new Date(profile.createdAt) > new Date(latest.createdAt) ? profile : latest
  );
}

export async function saveMeasurements(measurements: BodyMeasurements): Promise<void> {
  const db = await getDB();
  const key = new Date().toISOString();
  await db.put('measurements', { ...measurements, capturedAt: new Date(key) } as BodyMeasurements);
}

export async function getLatestMeasurements(): Promise<BodyMeasurements | undefined> {
  const db = await getDB();
  const allMeasurements = await db.getAll('measurements');
  if (allMeasurements.length === 0) return undefined;
  return allMeasurements.sort((a, b) =>
    new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
  )[0];
}

export async function clearAllMeasurements(): Promise<void> {
  const db = await getDB();
  await db.clear('measurements');
}
