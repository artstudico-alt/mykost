import { useState, useCallback } from 'react'

export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState({
    title: '',
    message: '',
    type: 'info', // 'info' | 'success' | 'error' | 'warning' | 'confirm'
    onConfirm: null,
    onCancel: null,
    confirmText: 'OK',
    cancelText: 'Cancel',
  })

  const openModal = useCallback((options) => {
    setConfig({
      title: options.title || '',
      message: options.message || '',
      type: options.type || 'info',
      onConfirm: options.onConfirm || null,
      onCancel: options.onCancel || null,
      confirmText: options.confirmText || 'OK',
      cancelText: options.cancelText || 'Cancel',
    })
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  const confirm = useCallback((message, onConfirm, onCancel) => {
    openModal({
      title: 'Konfirmasi',
      message,
      type: 'confirm',
      onConfirm: () => {
        onConfirm?.()
        closeModal()
      },
      onCancel: () => {
        onCancel?.()
        closeModal()
      },
      confirmText: 'Ya',
      cancelText: 'Tidak',
    })
  }, [openModal, closeModal])

  const alert = useCallback((message, type = 'info', onConfirm) => {
    openModal({
      title: type === 'error' ? 'Error' : type === 'success' ? 'Sukses' : 'Informasi',
      message,
      type,
      onConfirm: () => {
        onConfirm?.()
        closeModal()
      },
      confirmText: 'OK',
    })
  }, [openModal, closeModal])

  return {
    isOpen,
    config,
    openModal,
    closeModal,
    confirm,
    alert,
  }
}
