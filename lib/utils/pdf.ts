// Utility function to save the current page as PDF
import html2canvas from 'html2canvas'

export async function savePageAsPDF(filename?: string, element?: HTMLElement): Promise<void> {
  try {
    // Get the main content element (or body if no specific element)
    const targetElement = element || document.body
    if (!targetElement) {
      throw new Error('No element found to convert to PDF')
    }

    // Show loading indicator (optional)
    const loadingIndicator = document.createElement('div')
    loadingIndicator.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px 40px;
      border-radius: 8px;
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
    `
    loadingIndicator.textContent = 'Generating PDF...'
    document.body.appendChild(loadingIndicator)

    // Convert HTML to canvas
    const canvas = await html2canvas(targetElement, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: targetElement.scrollWidth,
      windowHeight: targetElement.scrollHeight,
    })

    // Remove loading indicator
    document.body.removeChild(loadingIndicator)

    // Calculate PDF dimensions
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const pdfWidth = imgWidth * 0.264583 // Convert pixels to mm (1px = 0.264583mm at 96dpi)
    const pdfHeight = imgHeight * 0.264583

    // Dynamically import jsPDF to avoid Jest/Node ESM parsing issues at import-time
    const { default: jsPDF } = await import('jspdf')

    // Create PDF
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
    })

    // Add image to PDF
    const imgData = canvas.toDataURL('image/png')
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

    // Generate filename
    const defaultFilename = `sololo-${new Date().toISOString().split('T')[0]}.pdf`
    const finalFilename = filename || defaultFilename

    // Save PDF
    pdf.save(finalFilename)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}
