import * as XLSX from 'xlsx';

/**
 * Exports an array of objects to an Excel file.
 * @param {Array<object>} data - The array of data to export.
 * @param {string} filename - The desired name for the output file (without extension).
 */
export const exportToExcel = (data, filename) => {
  if (!data || data.length === 0) {
    alert('No data available to export to Excel.');
    return;
  }

  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  // Convert the array of objects to a worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  // Generate the Excel file and trigger a download
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};