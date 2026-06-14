/**
 * Robust RFC 4180 compliant CSV parser written in TypeScript.
 * Handles quoted fields containing commas, escaped quotes, and different line endings.
 */
export function parseCSV(csvText: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentValue = "";

  // Normalize newlines
  const text = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped double quote inside a quoted field (e.g. "")
          currentValue += '"';
          i++; // Skip the next quote
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        currentValue += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(currentValue.trim());
        currentValue = "";
      } else if (char === '\n') {
        row.push(currentValue.trim());
        // Only push non-empty rows
        if (row.length > 1 || (row.length === 1 && row[0] !== "")) {
          result.push(row);
        }
        row = [];
        currentValue = "";
      } else {
        currentValue += char;
      }
    }
  }

  // Push the final field and row if anything remains
  if (currentValue !== "" || row.length > 0) {
    row.push(currentValue.trim());
    if (row.length > 1 || (row.length === 1 && row[0] !== "")) {
      result.push(row);
    }
  }

  return result;
}
