// Access global variable from script tag
declare const pdfjsLib: any;

export const extractTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  // Limit to first 10 pages to avoid context window explosion, or extract all if critical.
  // For this demo, we'll try to get as much as reasonable.
  const numPages = Math.min(pdf.numPages, 15);
  
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += `[Page ${i}] ${pageText}\n`;
  }
  
  return fullText;
};
