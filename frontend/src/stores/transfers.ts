import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { chatbotService } from '@/services/api'

export interface AgentTransfer {
  id: string
  contact_id: string
  contact_name: string
  phone_number: string
  whatsapp_account: string
  status: 'active' | 'resumed'
  source: 'manual' | 'flow' | 'keyword'
  agent_id?: string
  agent_name?: string
  transferred_by?: string
  transferred_by_name?: string
  notes?: string
  transferred_at: string
  resumed_at?: string
  resumed_by?: string
  resumed_by_name?: string
}

export const useTransfersStore = defineStore('transfers', () => {
  const transfers = ref<AgentTransfer[]>([])
  const queueCount = ref(0)
  const isLoading = ref(false)

  const activeTransfers = computed(() =>
    transfers.value.filter(t => t.status === 'active')
  )

  const myTransfers = computed(() => {
    const userId = localStorage.getItem('user_id')
    return transfers.value.filter(t =>
      t.status === 'active' && t.agent_id === userId
    )
  })

  const unassignedCount = computed(() =>
    transfers.value.filter(t => t.status === 'active' && !t.agent_id).length
  )

  // Get active transfer for a specific contact
  function getActiveTransferForContact(contactId: string): AgentTransfer | undefined {
    return transfers.value.find(t => t.contact_id === contactId && t.status === 'active')
  }

  async function fetchTransfers(params?: { status?: string }) {
    isLoading.value = true
    try {
      const response = await chatbotService.listTransfers(params)
      console.log('Transfers API response:', response.data)
      const data = response.data.data || response.data
      console.log('Parsed transfers data:', data)
      transfers.value = data.transfers || []
      queueCount.value = data.queue_count ?? 0
      console.log('Queue count:', queueCount.value, 'Transfers:', transfers.value.length)
    } catch (error) {
      console.error('Failed to fetch transfers:', error)
    } finally {
      isLoading.value = false
    }
  }

  function addTransfer(transfer: AgentTransfer) {
    // Add to beginning (newest first for display, but server returns FIFO)
    const exists = transfers.value.some(t => t.id === transfer.id)
    if (!exists) {
      transfers.value.unshift(transfer)
      if (!transfer.agent_id) {
        queueCount.value++
      }
      console.log('Transfer added to store:', transfer.id, 'Total:', transfers.value.length, 'Queue count:', queueCount.value)
    } else {
      console.log('Transfer already exists:', transfer.id)
    }
  }

  function updateTransfer(id: string, updates: Partial<AgentTransfer>) {
    const index = transfers.value.findIndex(t => t.id === id)
    if (index !== -1) {
      const oldTransfer = transfers.value[index]
      transfers.value[index] = { ...oldTransfer, ...updates }

      // Update queue count if assignment changed
      if (updates.agent_id !== undefined) {
        if (!oldTransfer.agent_id && updates.agent_id) {
          queueCount.value = Math.max(0, queueCount.value - 1)
        } else if (oldTransfer.agent_id && !updates.agent_id) {
          queueCount.value++
        }
      }

      // Update queue count if status changed to resumed
      if (updates.status === 'resumed' && oldTransfer.status === 'active' && !oldTransfer.agent_id) {
        queueCount.value = Math.max(0, queueCount.value - 1)
      }
    }
  }

  function removeTransfer(id: string) {
    const index = transfers.value.findIndex(t => t.id === id)
    if (index !== -1) {
      const transfer = transfers.value[index]
      if (transfer.status === 'active' && !transfer.agent_id) {
        queueCount.value = Math.max(0, queueCount.value - 1)
      }
      transfers.value.splice(index, 1)
    }
  }

  return {
    transfers,
    queueCount,
    isLoading,
    activeTransfers,
    myTransfers,
    unassignedCount,
    fetchTransfers,
    addTransfer,
    updateTransfer,
    removeTransfer,
    getActiveTransferForContact
  }
})
