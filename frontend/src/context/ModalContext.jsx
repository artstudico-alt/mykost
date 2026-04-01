import { createContext, useContext, useState, useCallback } from 'react'
import Modal from '../components/Modal'

const ModalContext = createContext()

export const ModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState({
    title: '',
    message: '',
    type: 'info',
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

  const confirm = useCallback((message, onConfirm = null, onCancel = null) => {
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

  const alert = useCallback((message, type = 'info', onConfirm = null) => {
    const titles = {
      error: 'Error',
      success: 'Sukses',
      warning: 'Peringatan',
      info: 'Informasi',
    }
    openModal({
      title: titles[type] || 'Informasi',
      message,
      type,
      onConfirm: () => {
        onConfirm?.()
        closeModal()
      },
      confirmText: 'OK',
    })
  }, [openModal, closeModal])

  return (
    <ModalContext.Provider value={{ openModal, closeModal, confirm, alert }}>
      {children}
      <Modal isOpen={isOpen} config={config} onClose={closeModal} />
    </ModalContext.Provider>
  )
}

export const useGlobalModal = () => {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useGlobalModal must be used within ModalProvider')
  }
  return context
}
