import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('estoqueDesktop', {
  isDesktop: true,
})
