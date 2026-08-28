/**
 * ResizableImage Extension - resizable image extension (supports drag to move)
 * @description Extends the standard Image extension, supports width and height attributes for resizing images, and adds a draggable resize handle
 * @features
 * - Supports dragging images between text (standalone implementation, does not depend on drag-handle)
 * - Supports image resizing (proportional scaling)
 * - Supports image alignment (left, center, right)
 */

import Image from '@tiptap/extension-image'

export interface ResizableImageOptions {
  HTMLAttributes?: Record<string, any>
  inline?: boolean
  allowBase64?: boolean
  /** Whether to enable image enhancement (drag resizing), defaults to true */
  enableResize?: boolean
}

export const ResizableImage = Image.extend<ResizableImageOptions>({
  name: 'image',

  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {},
      inline: true,
      allowBase64: true,
      enableResize: true, // image enhancement is enabled by default
    }
  },

  addAttributes() {
    // Create a common configuration for size attributes
    const createSizeAttribute = (name: 'width' | 'height') => ({
      default: null,
      parseHTML: (element: HTMLElement) => {
        const value = element.getAttribute(name)
        return value ? parseInt(value, 10) : null
      },
      renderHTML: (attributes: Record<string, any>) => {
        return attributes[name] ? { [name]: attributes[name] } : {}
      },
    })

    return {
      ...this.parent?.(),
      width: createSizeAttribute('width'),
      height: createSizeAttribute('height'),
      align: {
        default: null,
        parseHTML: (element) => {
          const align =
            element.getAttribute('data-align') ||
            element.style.textAlign ||
            element.parentElement?.style.textAlign
          return align === 'left' || align === 'center' || align === 'right' ? align : null
        },
        renderHTML: (attributes) => {
          return attributes.align ? { 'data-align': attributes.align } : {}
        },
      },
    }
  },

  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const options = this.options
      const enableResize = options.enableResize !== false // enabled by default
      
      const dom = document.createElement('div')
      dom.className = 'resizable-image-wrapper'
      dom.setAttribute('data-type', 'resizable-image-wrapper')
      
      // Set the alignment
      if (node.attrs.align) {
        dom.style.textAlign = node.attrs.align
        dom.setAttribute('data-align', node.attrs.align)
      }

      const img = document.createElement('img')
      img.src = node.attrs.src
      img.alt = node.attrs.alt || ''
      img.title = node.attrs.title || ''
      
      // Decide whether to enable dragging based on configuration
      if (enableResize) {
        img.draggable = true
        img.style.cursor = 'move'
      }

      // Set the image size
      const updateImageSize = () => {
        if (node.attrs.width) {
          img.style.width = `${node.attrs.width}px`
          img.style.height = 'auto'
        } else if (node.attrs.height) {
          img.style.height = `${node.attrs.height}px`
          img.style.width = 'auto'
        } else {
          img.style.maxWidth = '100%'
          img.style.height = 'auto'
        }
      }
      updateImageSize()

      // After the image loads, use the natural width if no width was set
      img.onload = () => {
        if (!node.attrs.width && !node.attrs.height && img.naturalWidth > 0) {
          img.style.width = `${img.naturalWidth}px`
          img.style.height = 'auto'
        }
      }

      // Apply other HTML attributes
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        if (key !== 'width' && key !== 'height' && key !== 'src' && key !== 'alt' && key !== 'title') {
          img.setAttribute(key, value)
        }
      })

      // Create the resize handle in the bottom-right corner (dot mode) - only when enhancement is enabled
      let resizeHandle: HTMLDivElement | null = null
      if (enableResize) {
        resizeHandle = document.createElement('div')
        resizeHandle.className = 'resize-handle'
        resizeHandle.setAttribute('contenteditable', 'false')
        // Prevent the resize handle from triggering image dragging
        resizeHandle.draggable = false
        dom.appendChild(resizeHandle)
      }

      dom.appendChild(img)

      // Image click event, selects the image node
      dom.addEventListener('click', (e) => {
        if (enableResize && resizeHandle && (e.target === resizeHandle || resizeHandle.contains(e.target as HTMLElement))) {
          return
        }
        e.stopPropagation()
        const pos = typeof getPos === 'function' ? getPos() : null
        if (pos !== null && pos !== undefined) {
          editor.commands.setNodeSelection(pos)
        }
      })

      // Image dragging: supports moving between text (only when enhancement is enabled)
      if (enableResize) {
        img.addEventListener('dragstart', (e: DragEvent) => {
          const pos = typeof getPos === 'function' ? getPos() : null
          if (pos !== null && pos !== undefined) {
            const { state } = editor
            const nodeAtPos = state.doc.nodeAt(pos)
            if (nodeAtPos && nodeAtPos.type.name === 'image') {
              // Set drag effects
              if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move'
                // Create a drag preview image (optional, improves user experience)
                const dragImage = img.cloneNode(true) as HTMLImageElement
                dragImage.style.width = `${img.offsetWidth}px`
                dragImage.style.height = `${img.offsetHeight}px`
                dragImage.style.opacity = '0.5'
                document.body.appendChild(dragImage)
                e.dataTransfer.setDragImage(dragImage, img.offsetWidth / 2, img.offsetHeight / 2)
                setTimeout(() => {
                  if (document.body.contains(dragImage)) {
                    document.body.removeChild(dragImage)
                  }
                }, 0)
              }
            }
          }
        })

        // Prevent the resize handle from triggering image dragging
        if (resizeHandle) {
          resizeHandle.addEventListener('mousedown', (e) => {
            e.stopPropagation()
          })
        }
      }

      // Drag to resize (proportional scaling) - only when enhancement is enabled
      if (enableResize && resizeHandle) {
        let isResizing = false
        let startX = 0
        let startY = 0
        let startWidth = 0
        let startHeight = 0
        let aspectRatio = 1

        const handleMouseDown = (e: MouseEvent) => {
          // Prevent the resize handle from triggering image dragging, but allow resizing
          e.preventDefault()
          e.stopPropagation()
          // Temporarily disable dragging
          img.draggable = false
          isResizing = true
          startX = e.clientX
          startY = e.clientY
          
          // Get the current image dimensions
          startWidth = node.attrs.width || img.offsetWidth || img.naturalWidth
          startHeight = node.attrs.height || img.offsetHeight || img.naturalHeight

          // Calculate the aspect ratio (preferring natural dimensions)
          if (img.naturalWidth && img.naturalHeight) {
            aspectRatio = img.naturalHeight / img.naturalWidth
          } else if (startWidth && startHeight) {
            aspectRatio = startHeight / startWidth
          } else {
            aspectRatio = 1
          }

          document.addEventListener('mousemove', handleMouseMove)
          document.addEventListener('mouseup', handleMouseUp)
          dom.classList.add('resizing')
        }

        const handleMouseMove = (e: MouseEvent) => {
          if (!isResizing) return

          // Calculate the mouse movement distance (using the diagonal distance to keep proportions)
          const deltaX = e.clientX - startX
          const deltaY = e.clientY - startY
          
          // Use the larger delta to keep the proportions
          const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY
          
          // Calculate the new width (keeping the aspect ratio)
          const newWidth = Math.max(50, Math.min(2000, startWidth + delta))
          const newHeight = newWidth * aspectRatio

          // Update the image size in real time
          img.style.width = `${newWidth}px`
          img.style.height = `${newHeight}px`
        }

        const handleMouseUp = () => {
          if (!isResizing) return
          isResizing = false

          const finalWidth = parseInt(img.style.width, 10)
          const finalHeight = parseInt(img.style.height, 10)
          const pos = typeof getPos === 'function' ? getPos() : null

          if (pos !== null && pos !== undefined) {
            // Use the editor's chained command to update the image size
            const { state, view } = editor
            const { tr } = state
            const nodeAtPos = tr.doc.nodeAt(pos)
            
            if (nodeAtPos && nodeAtPos.type.name === 'image') {
              tr.setNodeMarkup(pos, undefined, {
                ...nodeAtPos.attrs,
                width: finalWidth,
                height: finalHeight,
              })
              view.dispatch(tr)
            }
          }

          document.removeEventListener('mousemove', handleMouseMove)
          document.removeEventListener('mouseup', handleMouseUp)
          dom.classList.remove('resizing')
          // Restore the drag functionality
          img.draggable = true
        }

        resizeHandle.addEventListener('mousedown', handleMouseDown)
      }

      return {
        dom,
        contentDOM: null,
        update: (updatedNode) => {
          // Update the image source
          if (updatedNode.attrs.src !== node.attrs.src) {
            img.src = updatedNode.attrs.src
          }

          // Update the image size
          if (
            updatedNode.attrs.width !== node.attrs.width ||
            updatedNode.attrs.height !== node.attrs.height
          ) {
            if (updatedNode.attrs.width) {
              img.style.width = `${updatedNode.attrs.width}px`
              img.style.height = 'auto'
            } else if (updatedNode.attrs.height) {
              img.style.height = `${updatedNode.attrs.height}px`
              img.style.width = 'auto'
            } else {
              img.style.width = ''
              img.style.height = ''
              img.style.maxWidth = '100%'
            }
          }

          // Update the alignment
          if (updatedNode.attrs.align !== node.attrs.align) {
            if (updatedNode.attrs.align) {
              dom.style.textAlign = updatedNode.attrs.align
              dom.setAttribute('data-align', updatedNode.attrs.align)
            } else {
              dom.style.textAlign = ''
              dom.removeAttribute('data-align')
            }
          }

          node = updatedNode
          return true
        },
        destroy: () => {
          // Cleanup work (if needed)
        },
      }
    }
  },

  renderHTML({ HTMLAttributes }) {
    const { width, height, ...rest } = HTMLAttributes
    const style: string[] = []
    
    if (width) {
      style.push(`width: ${width}px`)
    }
    if (height) {
      style.push(`height: ${height}px`)
    }
    
    return [
      'img',
      {
        ...rest,
        ...(style.length > 0 ? { style: style.join('; ') } : {}),
      },
    ]
  },
})

