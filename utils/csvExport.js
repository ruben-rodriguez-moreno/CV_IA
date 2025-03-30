/**
 * Convert data to CSV format and trigger download
 * @param {Array} data - Array of objects to convert to CSV
 * @param {string} filename - Name of the file without extension
 */
export function exportToCSV(data, filename) {
  if (!data || !data.length) {
    console.error('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        // Format value for CSV
        let value = row[header] || '';
        // If value contains comma, quotes, or newlines, wrap in quotes
        if (value.toString().includes(',') || value.toString().includes('"') || value.toString().includes('\n')) {
          value = `"${value.toString().replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ];
  
  // Combine into single string
  const csvString = csvRows.join('\n');
  
  // Create download link
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  // Add to document, trigger download, and clean up
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Check if user has permission to export to CSV
 * @param {string} planType - User's subscription plan type
 * @returns {boolean} - Whether user can export to CSV
 */
export function canExportCSV(planType) {
  return ['pro', 'enterprise'].includes(planType?.toLowerCase());
}
