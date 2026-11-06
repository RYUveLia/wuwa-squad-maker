import { useState } from 'react'
import { MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import type { Character } from '../types'
import { parseSlotId } from '../utils/squadEditing'
import { POOL_DROPPABLE_ID, SQUAD_ROW_PREFIX, getPoolCharacter } from '../utils/dragData'
import type { SquadEditorApi } from './useSquadEditor'

/** 드래그 앤 드롭: 도감 → 슬롯 배치, 슬롯 간 이동/교환, 슬롯 → 도감 해제, 파티 행 정렬 */
export function useSquadDnd(editor: SquadEditorApi) {
  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } })
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  const sensors = useSensors(mouseSensor, touchSensor)

  const [activeDragChar, setActiveDragChar] = useState<Character | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current
    const char = data?.char || (data?.element ? (data as Character) : null)
    if (char) setActiveDragChar(char)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragChar(null)
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId === overId) return

    // 파티 행 정렬
    if (activeId.startsWith(SQUAD_ROW_PREFIX) && overId.startsWith(SQUAD_ROW_PREFIX)) {
      editor.reorderSquads(activeId, overId)
      return
    }

    const data = active.data.current

    // 도감 카드 → 슬롯
    const poolChar = getPoolCharacter(data)
    if (poolChar) {
      const target = parseSlotId(overId)
      if (target && !editor.isMaxed(poolChar.id)) editor.selectCharacter(poolChar, target.squadIdx, target.slotIdx)
      return
    }

    // 슬롯 캐릭터 → 도감(해제) 또는 다른 슬롯(이동/교환)
    if (data?.squadIdx !== undefined && data?.slotIdx !== undefined) {
      const source = { squadIdx: data.squadIdx as number, slotIdx: data.slotIdx as number }
      if (overId === POOL_DROPPABLE_ID) {
        editor.requestRemoveCharacter(source.squadIdx, source.slotIdx)
        return
      }
      const target = parseSlotId(overId)
      if (target) editor.moveSlot(source, target)
    }
  }

  return { sensors, activeDragChar, handleDragStart, handleDragEnd }
}
