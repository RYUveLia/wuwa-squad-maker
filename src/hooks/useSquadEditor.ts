import { arrayMove } from '@dnd-kit/sortable'
import type { Character } from '../types'
import { checkCharacterMaxedOut, getAssignedSquadIndices, getMaxDeployment } from '../utils/character'
import { createEmptySquadRow, createEmptySquads } from '../utils/squadRow'
import {
  appendSquadWith,
  deleteSquad,
  findAutoPlaceSlot,
  moveOrSwapSlot,
  placeCharacter,
  removeCharacterAt,
  removeOneFromSquad,
  setSquadCircuit,
  type SlotPosition
} from '../utils/squadEditing'
import type { ConfirmApi } from './useConfirm'
import type { VersionBoardsApi } from './useVersionBoards'

interface Deps {
  boards: VersionBoardsApi
  showToast: (message: string) => void
  confirm: ConfirmApi
}

/** 현재 보드의 파티 편성 편집 (현재 버전의 출전 한도 규칙 적용) */
export function useSquadEditor({ boards, showToast, confirm }: Deps) {
  const { currentVersion, squadsList, squads, squadIds, updateCurrentBoard } = boards

  const limitOf = (charId: string) => getMaxDeployment(charId, currentVersion)
  const isMaxed = (charId: string) => checkCharacterMaxedOut(charId, squads, currentVersion)
  const assignedSquadIndicesOf = (charId: string) => getAssignedSquadIndices(charId, squads)

  const addSquad = () => updateCurrentBoard(prev => [...prev, createEmptySquadRow(prev.length)])

  const requestDeleteSquad = (squadIdx: number) =>
    confirm.requestConfirm(
      `정말 ${squadIdx + 1}번 파티를 삭제하시겠습니까?`,
      () => {
        updateCurrentBoard(prev => deleteSquad(prev, squadIdx))
        showToast(`${squadIdx + 1}번 파티가 삭제되었습니다.`)
      },
      '해당 파티의 모든 캐릭터 배치 및 회로 버프가 즉시 제거됩니다.',
      '삭제하기'
    )

  const selectCharacter = (char: Character, squadIdx: number, slotIdx: number) =>
    updateCurrentBoard(prev => placeCharacter(prev, char, { squadIdx, slotIdx }, limitOf(char.id)))

  const requestRemoveCharacter = (squadIdx: number, slotIdx: number) => {
    const char = squadsList[squadIdx]?.characters[slotIdx]
    if (!char) return
    confirm.requestConfirm(
      `"${char.name}" 공명자를 파티에서 제외하시겠습니까?`,
      () => {
        updateCurrentBoard(prev => removeCharacterAt(prev, { squadIdx, slotIdx }))
        showToast(`${char.name} 편성을 해제했습니다.`)
      },
      '제외된 캐릭터는 파티 목록에서 즉시 제거됩니다.',
      '제외하기'
    )
  }

  /** 도감 카드 클릭: 한도 미만이면 빈 슬롯에 자동 배치(없으면 파티 추가 제안), 한도면 마지막 배치 해제 */
  const toggleCharacter = (char: Character) => {
    const assigned = assignedSquadIndicesOf(char.id)
    if (assigned.length < limitOf(char.id)) {
      const slot = findAutoPlaceSlot(squadsList, char.id)
      if (slot) {
        selectCharacter(char, slot.squadIdx, slot.slotIdx)
        return
      }
      confirm.openConfirm({
        message: '편성할 빈 슬롯이 없습니다.',
        subMessage: `새로운 파티를 추가하고 [${char.name}] 공명자를 배치하시겠습니까?`,
        confirmText: '파티 추가 및 배치',
        onConfirm: () => {
          updateCurrentBoard(prev => appendSquadWith(prev, char))
          showToast(`새 파티가 추가되고 ${char.name}이 배치되었습니다.`)
        }
      })
      return
    }

    const lastAssignedSquadIdx = assigned[assigned.length - 1]
    confirm.requestConfirm(
      `"${char.name}" 공명자를 파티에서 제외하시겠습니까?`,
      () => {
        updateCurrentBoard(prev => removeOneFromSquad(prev, char.id, lastAssignedSquadIdx))
        showToast(`${char.name} 편성을 해제했습니다.`)
      },
      '제외된 캐릭터는 파티 목록에서 즉시 제거됩니다.',
      '제외하기'
    )
  }

  const moveSlot = (source: SlotPosition, target: SlotPosition) =>
    updateCurrentBoard(prev => moveOrSwapSlot(prev, source, target))

  /** 파티 행 드래그 정렬 */
  const reorderSquads = (activeRowId: string, overRowId: string) => {
    const oldIndex = squadIds.indexOf(activeRowId)
    const newIndex = squadIds.indexOf(overRowId)
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return
    updateCurrentBoard(prev => arrayMove(prev, oldIndex, newIndex))
    showToast('파티 순서가 변경되었습니다.')
  }

  const selectCircuitBuff = (squadIdx: number, buffId: string | null) => {
    updateCurrentBoard(prev => setSquadCircuit(prev, squadIdx, buffId))
    showToast(buffId ? '회로 버프가 적용되었습니다.' : '회로 버프 선택이 해제되었습니다.')
  }

  const requestResetSquads = () =>
    confirm.requestConfirm(
      `${currentVersion} 버전의 모든 파티 편성을 초기화하시겠습니까?`,
      () => {
        updateCurrentBoard(createEmptySquads())
        showToast('모든 파티 편성이 초기화되었습니다.')
      },
      '이 버전의 모든 파티 슬롯이 즉시 비워지며 되돌릴 수 없습니다. (다른 버전 파티는 유지)',
      '초기화하기'
    )

  return {
    limitOf,
    isMaxed,
    assignedSquadIndicesOf,
    addSquad,
    requestDeleteSquad,
    selectCharacter,
    requestRemoveCharacter,
    toggleCharacter,
    moveSlot,
    reorderSquads,
    selectCircuitBuff,
    requestResetSquads
  }
}

export type SquadEditorApi = ReturnType<typeof useSquadEditor>
