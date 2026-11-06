import { useEffect, useState } from 'react'
import type { SquadRow } from '../types'
import { GAME_VERSIONS } from '../constants/versions'
import { createEmptySquads } from '../utils/squadRow'
import { loadSelectedVersion, loadSquadsByVersion, saveSelectedVersion, saveSquadsByVersion } from '../utils/squadStorage'

type BoardUpdater = SquadRow[] | ((prev: SquadRow[]) => SquadRow[])

/** 버전별 편성 보드 상태 (현재 버전, 버전 → 파티 목록, 영속화) */
export function useVersionBoards() {
  const [currentVersion, setCurrentVersion] = useState<string>(loadSelectedVersion)
  const [squadsByVersion, setSquadsByVersion] = useState<Record<string, SquadRow[]>>(() => {
    const loaded = loadSquadsByVersion()
    const initialVersion = loadSelectedVersion()
    return loaded[initialVersion] ? loaded : { ...loaded, [initialVersion]: createEmptySquads() }
  })

  useEffect(() => {
    saveSquadsByVersion(squadsByVersion)
  }, [squadsByVersion])

  /** 현재 보드의 파티 목록 */
  const squadsList: SquadRow[] = squadsByVersion[currentVersion] ?? []

  /** 현재 보드만 갱신 */
  const updateCurrentBoard = (updater: BoardUpdater) => {
    setSquadsByVersion(prev => {
      const current = prev[currentVersion] ?? createEmptySquads()
      const next = typeof updater === 'function' ? updater(current) : updater
      return { ...prev, [currentVersion]: next }
    })
  }

  /** 지정 버전 보드를 통째로 교체 */
  const replaceBoard = (version: string, rows: SquadRow[]) => {
    setSquadsByVersion(prev => ({ ...prev, [version]: rows }))
  }

  /** 전체 보드 교체 (이관 등 여러 보드를 한 번에 바꿀 때) */
  const replaceAllBoards = (boards: Record<string, SquadRow[]>) => setSquadsByVersion(boards)

  /** 보드 전환 (처음 여는 버전이면 빈 파티 3줄로 시작) */
  const switchVersion = (version: string) => {
    setSquadsByVersion(prev => (prev[version] ? prev : { ...prev, [version]: createEmptySquads() }))
    setCurrentVersion(version)
    saveSelectedVersion(version)
  }

  return {
    versions: GAME_VERSIONS,
    currentVersion,
    squadsByVersion,
    squadsList,
    updateCurrentBoard,
    replaceBoard,
    replaceAllBoards,
    switchVersion
  }
}

export type VersionBoardsApi = ReturnType<typeof useVersionBoards>
