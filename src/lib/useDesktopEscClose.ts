import { useEffect } from 'react'

const desktopMedia = '(min-width: 1024px) and (hover: hover) and (pointer: fine)'

export function useDesktopEscClose(onClose: () => void) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.matchMedia(desktopMedia).matches) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])
}
