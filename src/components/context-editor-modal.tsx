'use client';

import React, { useState, useEffect } from 'react';
import { CustomContext } from '../services/ai-keyword-service';

interface ContextEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain: string;
  currentContext: CustomContext | null;
  onSave: (domain: string, context: CustomContext) => void;
  onDelete: (domain: string) => void;
}

export default function ContextEditorModal({
  isOpen,
  onClose,
  domain,
  currentContext,
  onSave,
  onDelete
}: ContextEditorModalProps) {
  const [formData, setFormData] = useState<CustomContext>({
    primaryTheme: '',
    customKeywords: [],
    seasonalModifiers: {
      fall: [],
      winter: [],
      summer: [],
      spring: []
    },
    notes: ''
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [seasonalInput, setSeasonalInput] = useState({ season: 'fall', keyword: '' });

  useEffect(() => {
    if (currentContext) {
      setFormData(currentContext);
    } else {
      setFormData({
        primaryTheme: '',
        customKeywords: [],
        seasonalModifiers: {
          fall: [],
          winter: [],
          summer: [],
          spring: []
        },
        notes: ''
      });
    }
  }, [currentContext, isOpen]);

  const handleSave = () => {
    onSave(domain, formData);
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete the custom context for this domain?')) {
      onDelete(domain);
      onClose();
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim()) {
      // Check if input contains commas (bulk import)
      const keywords = keywordInput.split(',').map(k => k.trim()).filter(k => k);
      
      if (keywords.length > 1) {
        // Bulk import: add all keywords at once
        setFormData(prev => ({
          ...prev,
          customKeywords: [...prev.customKeywords, ...keywords]
        }));
      } else {
        // Single keyword
        setFormData(prev => ({
          ...prev,
          customKeywords: [...prev.customKeywords, keywordInput.trim()]
        }));
      }
      setKeywordInput('');
    }
  };

  const removeKeyword = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customKeywords: prev.customKeywords.filter((_, i) => i !== index)
    }));
  };

  const addSeasonalKeyword = () => {
    if (seasonalInput.keyword.trim()) {
      // Check if input contains commas (bulk import)
      const keywords = seasonalInput.keyword.split(',').map(k => k.trim()).filter(k => k);
      
      setFormData(prev => ({
        ...prev,
        seasonalModifiers: {
          ...prev.seasonalModifiers,
          [seasonalInput.season]: [
            ...(prev.seasonalModifiers[seasonalInput.season as keyof typeof prev.seasonalModifiers] || []), 
            ...keywords
          ]
        }
      }));
      setSeasonalInput(prev => ({ ...prev, keyword: '' }));
    }
  };

  const removeSeasonalKeyword = (season: keyof typeof formData.seasonalModifiers, index: number) => {
    setFormData(prev => ({
      ...prev,
      seasonalModifiers: {
        ...prev.seasonalModifiers,
        [season]: prev.seasonalModifiers[season].filter((_, i) => i !== index)
      }
    }));
  };

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '2rem',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '80vh',
      overflowY: 'auto' as const,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      paddingBottom: '1rem',
      borderBottom: '1px solid #e5e7eb'
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#1a1a1a',
      margin: 0
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      color: '#6b7280',
      padding: '0.25rem'
    },
    formGroup: {
      marginBottom: '1.5rem'
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '500',
      marginBottom: '0.5rem',
      color: '#374151'
    },
    input: {
      width: '100%',
      padding: '0.5rem 0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '0.875rem'
    },
    textarea: {
      width: '100%',
      padding: '0.5rem 0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '0.875rem',
      minHeight: '80px',
      resize: 'vertical' as const
    },
    keywordContainer: {
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '0.5rem'
    },
    keywordTag: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      backgroundColor: '#eff6ff',
      color: '#1e40af',
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      fontSize: '0.75rem',
      marginRight: '0.25rem',
      marginBottom: '0.25rem'
    },
    removeButton: {
      background: 'none',
      border: 'none',
      color: '#6b7280',
      cursor: 'pointer',
      fontSize: '0.75rem',
      padding: '0'
    },
    button: {
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500',
      transition: 'all 0.2s'
    },
    primaryButton: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: 'white',
      color: '#374151',
      border: '1px solid #e5e7eb'
    },
    dangerButton: {
      backgroundColor: '#ef4444',
      color: 'white'
    },
    buttonGroup: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'flex-end',
      marginTop: '2rem',
      paddingTop: '1rem',
      borderTop: '1px solid #e5e7eb'
    },
    sectionTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#1a1a1a',
      marginBottom: '0.75rem',
      marginTop: '1.5rem'
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Edit Context: {domain}</h2>
          <button style={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Primary Theme</label>
          <input
            type="text"
            style={styles.input}
            placeholder="e.g., beverages, desserts, air fryer cooking..."
            value={formData.primaryTheme}
            onChange={(e) => setFormData(prev => ({ ...prev, primaryTheme: e.target.value }))}
          />
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
            The main focus of this website (what it specializes in)
          </p>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Custom Keywords</label>
          <div style={styles.keywordContainer}>
            <input
              type="text"
              style={styles.input}
              placeholder="Add keyword or paste comma-separated: keyword1, keyword2, keyword3..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            />
            <button style={{...styles.button, ...styles.secondaryButton}} onClick={addKeyword}>
              Add
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
            💡 Tip: Paste multiple keywords separated by commas for bulk import
          </p>
          <div style={{ marginTop: '0.5rem' }}>
            {formData.customKeywords.map((keyword, index) => (
              <span key={index} style={styles.keywordTag}>
                {keyword}
                <button style={styles.removeButton} onClick={() => removeKeyword(index)}>×</button>
              </span>
            ))}
          </div>
        </div>

        <div style={styles.sectionTitle}>Seasonal Modifiers</div>
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1rem' }}>
          Keywords that will be used during specific seasons
        </p>

        {(['fall', 'winter', 'summer', 'spring'] as const).map(season => (
          <div key={season} style={styles.formGroup}>
            <label style={styles.label}>{season.charAt(0).toUpperCase() + season.slice(1)} Keywords</label>
            <div style={styles.keywordContainer}>
              <input
                type="text"
                style={styles.input}
                placeholder={`Add ${season} keyword or comma-separated list...`}
                value={seasonalInput.season === season ? seasonalInput.keyword : ''}
                onChange={(e) => setSeasonalInput({ season, keyword: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && seasonalInput.season === season && addSeasonalKeyword()}
              />
              <button 
                style={{...styles.button, ...styles.secondaryButton}} 
                onClick={() => {
                  if (seasonalInput.season === season && seasonalInput.keyword.trim()) {
                    addSeasonalKeyword();
                  }
                }}
              >
                Add
              </button>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              {formData.seasonalModifiers[season].map((keyword, index) => (
                <span key={index} style={styles.keywordTag}>
                  {keyword}
                  <button style={styles.removeButton} onClick={() => removeSeasonalKeyword(season, index)}>×</button>
                </span>
              ))}
            </div>
          </div>
        ))}

        <div style={styles.formGroup}>
          <label style={styles.label}>Notes</label>
          <textarea
            style={styles.textarea}
            placeholder="Any additional notes about this website's focus..."
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          />
        </div>

        <div style={styles.buttonGroup}>
          {currentContext && (
            <button style={{...styles.button, ...styles.dangerButton}} onClick={handleDelete}>
              Delete Context
            </button>
          )}
          <button style={{...styles.button, ...styles.secondaryButton}} onClick={onClose}>
            Cancel
          </button>
          <button style={{...styles.button, ...styles.primaryButton}} onClick={handleSave}>
            Save Context
          </button>
        </div>
      </div>
    </div>
  );
}




