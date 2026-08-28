/**
 * Word Import Utility
 * @description Uses mammoth to convert .docx files to HTML and insert into editor
 * @note mammoth is loaded dynamically on demand
 */
import type { Editor } from '@tiptap/core'

export interface WordImportResult {
  html: string
  messages: string[]
}

/**
 * Convert Word file to HTML
 * @param file - .docx file
 * @returns Conversion result (HTML + message)
 */
export async function convertWordToHtml(file: File): Promise<WordImportResult> {
  // Dynamically load mammoth
  const mammothModule: any = await import('mammoth')
  const mammoth = mammothModule.default ?? mammothModule

  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Heading 5'] => h5:fresh",
        "p[style-name='Heading 6'] => h6:fresh",
      ],
    },
  )

  return {
    html: result.value as string,
    messages: (result.messages as Array<{ message: string }>).map((m) => m.message),
  }
}

/**
 * Import Word file to editor
 * @param editor - Tiptap editor instance
 * @param file - .docx file
 */
export async function importWordFile(editor: Editor, file: File): Promise<WordImportResult> {
  const result = await convertWordToHtml(file)

  if (result.html) {
    editor.chain().focus().setContent(result.html).run()
  }

  return result
}
