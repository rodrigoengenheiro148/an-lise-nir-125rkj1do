/**
 * Safely extracts CSS rules from all stylesheets, handling CORS restrictions.
 * This prevents SecurityError when accessing cssRules of external stylesheets.
 */
export const getSafeStyleRanges = () => {
  const styles: string[] = []

  Array.from(document.styleSheets).forEach((sheet) => {
    try {
      // Accessing cssRules can throw SecurityError for cross-origin stylesheets
      // This try-catch block satisfies the requirement to gracefully handle/ignore restrictions
      const rules = sheet.cssRules
      if (rules) {
        Array.from(rules).forEach((rule) => {
          styles.push(rule.cssText)
        })
      }
    } catch (e) {
      // Gracefully skip stylesheets that block rule access without crashing
      console.warn(
        'Skipping stylesheet export due to security restrictions:',
        e,
      )
    }
  })

  return styles.join('\n')
}

export const printElement = (elementId: string, title: string) => {
  const element = document.getElementById(elementId)
  if (!element) return false

  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    return false
  }

  // Extract styles using the safe method
  const css = getSafeStyleRanges()

  doc.open()
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          ${css}
          /* Core Print Styles */
          body { 
            background: white !important; 
            color: black !important; 
            padding: 20px; 
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          /* Print optimizations */
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            /* Reset sticky positioning for print so entire table prints */
            .sticky { position: static !important; }
            /* Ensure table visibility */
            table { width: 100%; border-collapse: collapse; }
            th, td { 
              border: 1px solid #e4e4e7 !important; 
              color: black !important; 
              page-break-inside: avoid;
            }
            /* Hide decorative elements */
            ::-webkit-scrollbar { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="print-content">
          <h1 style="margin-bottom: 20px; font-size: 24px; font-weight: bold; color: black;">${title}</h1>
          <p style="margin-bottom: 20px; color: #666; font-size: 14px;">Gerado em: ${new Date().toLocaleString()}</p>
          ${element.innerHTML}
        </div>
      </body>
    </html>
  `)
  doc.close()

  // Use a timeout to ensure styles are applied and resource loading is settled
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch (e) {
      console.error('Print failed:', e)
    } finally {
      // Cleanup
      setTimeout(() => document.body.removeChild(iframe), 1000)
    }
  }, 500)

  return true
}
