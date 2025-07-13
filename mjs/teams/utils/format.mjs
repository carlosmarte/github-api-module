import chalk from 'chalk';

export function formatDate(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

export function formatError(error) {
  if (error.response) {
    if (error.response.message) {
      return error.response.message;
    }
    
    if (error.response.errors) {
      return error.response.errors
        .map(err => `${err.field || 'Field'}: ${err.message || err.code}`)
        .join('\n');
    }
    
    return JSON.stringify(error.response, null, 2);
  }
  
  return error.message || 'Unknown error occurred';
}

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatPercentage(value, total) {
  if (!total || total === 0) return '0%';
  
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(1)}%`;
}

export function truncate(str, maxLength = 50) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  
  return str.substring(0, maxLength - 3) + '...';
}

export function colorizeStatus(status) {
  const statusColors = {
    active: chalk.green,
    pending: chalk.yellow,
    inactive: chalk.gray,
    error: chalk.red,
    success: chalk.green,
    warning: chalk.yellow,
    info: chalk.blue
  };
  
  const colorFn = statusColors[status.toLowerCase()] || chalk.white;
  return colorFn(status);
}

export function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  
  return `${seconds}s`;
}

export function formatList(items, separator = ', ') {
  if (!items || items.length === 0) return '-';
  
  return items.join(separator);
}

export function formatJson(obj, indent = 2) {
  return JSON.stringify(obj, null, indent);
}

export function formatTable(headers, rows) {
  const columnWidths = headers.map((header, i) => {
    const maxLength = Math.max(
      header.length,
      ...rows.map(row => String(row[i]).length)
    );
    return maxLength;
  });
  
  const formatRow = (row) => {
    return row.map((cell, i) => {
      const cellStr = String(cell);
      return cellStr.padEnd(columnWidths[i]);
    }).join(' | ');
  };
  
  const headerRow = formatRow(headers);
  const separator = columnWidths.map(w => '-'.repeat(w)).join('-|-');
  const dataRows = rows.map(formatRow);
  
  return [headerRow, separator, ...dataRows].join('\n');
}

export function formatPermissions(permissions) {
  if (!permissions) return '-';
  
  const perms = [];
  if (permissions.admin) perms.push('admin');
  if (permissions.maintain) perms.push('maintain');
  if (permissions.push) perms.push('push');
  if (permissions.triage) perms.push('triage');
  if (permissions.pull) perms.push('pull');
  
  return perms.length > 0 ? perms.join(', ') : 'none';
}