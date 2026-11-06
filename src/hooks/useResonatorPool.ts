import { useState } from 'react'
import { ALL_CHARACTERS, getSortedCharacters } from '../utils/character'
import { loadHideMaxedOut, loadOwnedResonatorIds, saveHideMaxedOut, saveOwnedResonatorIds } from '../utils/squadStorage'

/** 도감 속성 필터 목록 */
export const ELEMENT_FILTERS = ['All', 'Spectro', 'Aero', 'Electro', 'Fusion', 'Glacio', 'Havoc']

interface Deps {
  currentVersion: string
  isMaxed: (charId: string) => boolean
  showToast: (message: string) => void
}

/** 공명자 도감: 버전별 출시 공명자 + 속성/보유/배치 완료 필터 */
export function useResonatorPool({ currentVersion, isMaxed, showToast }: Deps) {
  const [selectedElement, setSelectedElement] = useState<string>('All')
  const [ownedResonatorIds, setOwnedResonatorIds] = useState<string[]>(() =>
    loadOwnedResonatorIds(ALL_CHARACTERS.map(c => c.id))
  )
  const [showOnlyOwned, setShowOnlyOwned] = useState(false)
  const [hideMaxedOut, setHideMaxedOutState] = useState<boolean>(loadHideMaxedOut)

  const setHideMaxedOut = (value: boolean) => {
    setHideMaxedOutState(value)
    saveHideMaxedOut(value)
  }

  const saveOwnedResonators = (ids: string[]) => {
    setOwnedResonatorIds(ids)
    saveOwnedResonatorIds(ids)
    showToast('보유 공명자 현황이 저장되었습니다.')
  }

  const filteredCharacters = getSortedCharacters(currentVersion).filter(c => {
    if (selectedElement !== 'All' && c.element !== selectedElement) return false
    if (showOnlyOwned && !ownedResonatorIds.includes(c.id)) return false
    if (hideMaxedOut && isMaxed(c.id)) return false
    return true
  })

  return {
    elements: ELEMENT_FILTERS,
    selectedElement,
    setSelectedElement,
    ownedResonatorIds,
    saveOwnedResonators,
    showOnlyOwned,
    setShowOnlyOwned,
    hideMaxedOut,
    setHideMaxedOut,
    filteredCharacters
  }
}
