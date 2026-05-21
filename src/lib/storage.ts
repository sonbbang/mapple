import type { KakaoPlace } from './kakao'

export interface Favorite {
  id: string
  place_name: string
  category_name: string
  road_address_name: string
  address_name: string
  place_url: string
  savedAt: string
}

export interface VisitRecord {
  id: string
  place_name: string
  category_name: string
  road_address_name: string
  address_name: string
  place_url: string
  visitedAt: string
}

const FAVORITES_KEY = 'mapple_favorites'
const HISTORY_KEY = 'mapple_history'
const MAX_HISTORY = 50

function readJson<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function writeJson<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // storage full or unavailable — silently ignore
  }
}

export function getFavorites(): Favorite[] {
  return readJson<Favorite>(FAVORITES_KEY)
}

export function addFavorite(place: KakaoPlace): Favorite[] {
  const list = getFavorites()
  if (list.some((f) => f.id === place.id)) return list
  const updated = [
    { ...place, savedAt: new Date().toISOString() },
    ...list,
  ]
  writeJson(FAVORITES_KEY, updated)
  return updated
}

export function removeFavorite(id: string): Favorite[] {
  const updated = getFavorites().filter((f) => f.id !== id)
  writeJson(FAVORITES_KEY, updated)
  return updated
}

export function isFavorited(id: string): boolean {
  return getFavorites().some((f) => f.id === id)
}

export function addVisitRecord(place: KakaoPlace): void {
  const list = readJson<VisitRecord>(HISTORY_KEY)
  const record: VisitRecord = { ...place, visitedAt: new Date().toISOString() }
  const updated = [record, ...list].slice(0, MAX_HISTORY)
  writeJson(HISTORY_KEY, updated)
}

export function getVisitHistory(): VisitRecord[] {
  return readJson<VisitRecord>(HISTORY_KEY)
}
