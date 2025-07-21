// Function to convert date format from DD-MM-YYYY to YYYY-MM-DD using Date object
export function convertDateFormat(dateString: string): string {
    const [day, month, year] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toISOString().split('T')[0];
}