'use client';

import React from 'react';

interface WebsiteData {
  domain: string;
  keyword: string;
  quota: number;
  originalKeyword?: string;
  aiGenerated?: boolean;
}

interface KeywordTableDisplayProps {
  websites: WebsiteData[];
  recipeTheme?: string;
  onCopyKeyword?: (keyword: string) => void;
  onExportCSV?: () => void;
  onSpinKeywords?: () => void;
  isSpinning?: boolean;
}

export default function KeywordTableDisplay({ 
  websites, 
  recipeTheme, 
  onCopyKeyword, 
  onExportCSV,
  onSpinKeywords,
  isSpinning = false
}: KeywordTableDisplayProps) {
  if (!websites || websites.length === 0) {
    return null;
  }

  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '1.5rem',
      marginBottom: '1.5rem'
    },
    header: {
      fontSize: '1.25rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: '#1a1a1a'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      fontSize: '14px'
    },
    th: {
      backgroundColor: '#f9fafb',
      padding: '0.75rem',
      textAlign: 'left' as const,
      fontWeight: '600',
      color: '#374151',
      borderBottom: '1px solid #e5e7eb'
    },
    td: {
      padding: '0.75rem',
      borderBottom: '1px solid #e5e7eb',
      color: '#374151'
    },
    button: {
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      border: '1px solid #d1d5db',
      cursor: 'pointer',
      fontSize: '12px',
      backgroundColor: 'white',
      color: '#374151',
      transition: 'all 0.2s'
    },
    copyButton: {
      backgroundColor: '#eff6ff',
      borderColor: '#3b82f6',
      color: '#1e40af'
    },
    exportButton: {
      backgroundColor: '#f0fdf4',
      borderColor: '#22c55e',
      color: '#15803d',
      marginTop: '1rem'
    },
    aiGenerated: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
      fontSize: '11px',
      padding: '0.125rem 0.375rem',
      borderRadius: '4px',
      marginLeft: '0.5rem'
    },
    themeInfo: {
      backgroundColor: '#f3f4f6',
      padding: '0.75rem',
      borderRadius: '6px',
      marginBottom: '1rem',
      fontSize: '14px',
      color: '#374151'
    }
  };

  const handleCopyKeyword = (keyword: string) => {
    if (onCopyKeyword) {
      onCopyKeyword(keyword);
    } else {
      navigator.clipboard.writeText(keyword).then(() => {
        // Could add a toast notification here
        console.log('Keyword copied to clipboard:', keyword);
      }).catch(err => {
        console.error('Failed to copy keyword:', err);
      });
    }
  };

  const handleExportCSV = () => {
    if (onExportCSV) {
      onExportCSV();
    } else {
      // Default CSV export functionality
      const csvContent = [
        ['Website', 'Keyword', 'Quota', 'AI Generated'].join(','),
        ...websites.map(site => [
          site.domain,
          `"${site.keyword}"`,
          site.quota,
          site.aiGenerated ? 'Yes' : 'No'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keyword-list-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.header}>📋 Keyword List</h3>
      
      {recipeTheme && (
        <div style={styles.themeInfo}>
          <strong>Recipe Theme:</strong> {recipeTheme}
          <span style={{ 
            fontSize: '0.75rem', 
            color: '#8b5cf6', 
            marginLeft: '0.5rem',
            fontWeight: 'bold'
          }}>
            🎯 Theme Applied
          </span>
        </div>
      )}

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Website</th>
            <th style={styles.th}>Keyword to Search</th>
            <th style={styles.th}>Quota</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {websites.map((website, index) => (
            <tr key={website.domain}>
              <td style={styles.td}>
                {website.domain}
                {website.aiGenerated && (
                  <span style={styles.aiGenerated}>AI</span>
                )}
              </td>
              <td style={styles.td}>
                {website.keyword}
                {website.originalKeyword && website.originalKeyword !== website.keyword && (
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '0.25rem' }}>
                    Original: {website.originalKeyword}
                  </div>
                )}
              </td>
              <td style={styles.td}>{website.quota}</td>
              <td style={styles.td}>
                <button
                  style={{...styles.button, ...styles.copyButton}}
                  onClick={() => handleCopyKeyword(website.keyword)}
                  title="Copy keyword to clipboard"
                >
                  📋 Copy
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button
          style={{...styles.button, ...styles.exportButton}}
          onClick={handleExportCSV}
        >
          📊 Export to CSV
        </button>
        
        {onSpinKeywords && (
          <button
            style={{
              ...styles.button,
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              opacity: isSpinning ? 0.7 : 1,
              cursor: isSpinning ? 'not-allowed' : 'pointer'
            }}
            onClick={onSpinKeywords}
            disabled={isSpinning}
          >
{isSpinning ? '🔄 Spinning...' : recipeTheme ? `🎰 Spin ${recipeTheme} Keywords` : '🎰 Spin Keywords'}
          </button>
        )}
      </div>
    </div>
  );
}
