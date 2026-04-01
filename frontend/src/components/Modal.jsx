import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const Modal = ({ isOpen, config, onClose }) => {
  if (!isOpen) return null

  const { title, message, type, onConfirm, onCancel, confirmText, cancelText } = config

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={48} color="#10b981" />
      case 'error':
        return <AlertCircle size={48} color="#059669" />
      case 'warning':
        return <AlertTriangle size={48} color="#65a30d" />
      default:
        return <Info size={48} color="#22c55e" />
    }
  }

  const getColors = () => {
    switch (type) {
      case 'success':
        return { bg: '#10b981', gradient: 'linear-gradient(135deg, #059669, #10b981)' }
      case 'error':
        return { bg: '#059669', gradient: 'linear-gradient(135deg, #047857, #059669)' }
      case 'warning':
        return { bg: '#65a30d', gradient: 'linear-gradient(135deg, #4d7c0f, #65a30d)' }
      default:
        return { bg: '#22c55e', gradient: 'linear-gradient(135deg, #16a34a, #22c55e)' }
    }
  }

  const colors = getColors()

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(8px)',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: colors.gradient,
            padding: '1.5rem 2rem',
            color: 'white',
            position: 'relative',
            textAlign: 'center',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
          <div style={{ marginBottom: '0.5rem' }}>{getIcon()}</div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{title}</h2>
        </div>

        {/* Content */}
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '1rem', color: '#374151', lineHeight: 1.6 }}>{message}</p>
        </div>

        {/* Buttons */}
        <div style={{ padding: '0 2rem 2rem', display: 'flex', gap: '1rem' }}>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '0.875rem',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                background: 'white',
                color: '#374151',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm || onClose}
            style={{
              flex: 1,
              padding: '0.875rem',
              borderRadius: '12px',
              border: 'none',
              background: colors.gradient,
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Modal
