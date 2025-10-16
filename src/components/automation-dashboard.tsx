'use client';

import React, { useState, useEffect } from 'react';
import { WebsiteData } from '../types';
import AIKeywordService, { CustomContext } from '../services/ai-keyword-service';
import ContextEditorModal from './context-editor-modal';
import CSVUploadPortal from './csv-upload-portal';
import KeywordTableDisplay from './keyword-table-display';

// Import all websites data
import allWebsitesData from '../../data/all-websites.json';

export default function AutomationDashboard() {
  const [websites, setWebsites] = useState<WebsiteData[]>([]);
  const [selectedWebsites, setSelectedWebsites] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('');
  const [showAddWebsite, setShowAddWebsite] = useState(false);
  const [newWebsite, setNewWebsite] = useState({
    domain: '',
    keyword: '',
    quota: 30,
    active: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [recipeTheme, setRecipeTheme] = useState('');
  const [aiService] = useState(() => new AIKeywordService());
  const [contextEditorOpen, setContextEditorOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<string>('');
  const [customContexts, setCustomContexts] = useState<Map<string, CustomContext>>(new Map());
  const [editingWebsite, setEditingWebsite] = useState<WebsiteData | null>(null);
  const [editingWebsiteOriginalDomain, setEditingWebsiteOriginalDomain] = useState<string>('');
  const [showEditWebsite, setShowEditWebsite] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [showKeywordTable, setShowKeywordTable] = useState(false);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Load websites - first try localStorage, then fall back to JSON file
    const loadWebsites = () => {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('recipe-automation-websites');
          if (stored) {
            const parsedWebsites = JSON.parse(stored);
            console.log('Loaded websites from localStorage:', parsedWebsites.length);
            return parsedWebsites;
          }
        } catch (error) {
          console.error('Failed to load websites from localStorage:', error);
        }
      }
      
      // Fallback to JSON file if no localStorage data
      const loadedWebsites = allWebsitesData.websites.map(site => ({
        domain: site.domain,
        keyword: site.keyword,
        quota: site.quota,
        active: site.active
      }));
      console.log('Loaded websites from JSON file:', loadedWebsites.length);
      return loadedWebsites;
    };
    
    setWebsites(loadWebsites());
    
    // Load custom contexts
    loadCustomContexts();
  }, []);

  const saveWebsitesToStorage = (websitesToSave: WebsiteData[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('recipe-automation-websites', JSON.stringify(websitesToSave));
        console.log('Saved websites to localStorage:', websitesToSave.length);
      } catch (error) {
        console.error('Failed to save websites to localStorage:', error);
      }
    }
  };

  const loadCustomContexts = () => {
    const contexts = new Map<string, CustomContext>();
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('recipe-automation-custom-contexts');
        if (stored) {
          const parsed = JSON.parse(stored);
          Object.entries(parsed).forEach(([domain, context]) => {
            contexts.set(domain, context as CustomContext);
          });
        }
      } catch (error) {
        console.error('Failed to load custom contexts:', error);
      }
    }
    setCustomContexts(contexts);
  };

  const handleEditContext = (domain: string) => {
    setEditingDomain(domain);
    setContextEditorOpen(true);
  };

  const handleSaveContext = (domain: string, context: CustomContext) => {
    aiService.setCustomContext(domain, context);
    loadCustomContexts();
  };

  const handleDeleteContext = (domain: string) => {
    aiService.removeCustomContext(domain);
    loadCustomContexts();
  };

  const handleSelectWebsite = (domain: string) => {
    setSelectedWebsites(prev =>
      prev.includes(domain)
        ? prev.filter(d => d !== domain)
        : [...prev, domain]
    );
  };

  const handleSelectAll = () => {
    const activeWebsites = websites.filter(w => w.active).map(w => w.domain);
    setSelectedWebsites(activeWebsites);
  };

  const handleDeselectAll = () => {
    setSelectedWebsites([]);
  };

  const handleAddWebsite = () => {
    if (newWebsite.domain && newWebsite.keyword) {
      const websiteToAdd: WebsiteData = {
        domain: newWebsite.domain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
        keyword: newWebsite.keyword,
        quota: newWebsite.quota,
        active: newWebsite.active
      };
      
      const updatedWebsites = [...websites, websiteToAdd];
      setWebsites(updatedWebsites);
      saveWebsitesToStorage(updatedWebsites);
      
      setNewWebsite({ domain: '', keyword: '', quota: 30, active: true });
      setShowAddWebsite(false);
      
      console.log('Website added:', websiteToAdd);
    }
  };

  const handleEditWebsite = (website: WebsiteData) => {
    console.log('🔍 Edit button clicked for website:', website.domain);
    setEditingWebsite({...website}); // Create a copy to avoid mutating original
    setEditingWebsiteOriginalDomain(website.domain); // Store original domain
    setShowEditWebsite(true);
    setShowAddWebsite(false); // Close add form if open
    console.log('🔍 Edit form should now be open, showEditWebsite:', true);
  };

  const handleSaveEditWebsite = () => {
    if (editingWebsite && editingWebsite.domain && editingWebsite.keyword) {
      // Clean up the domain (remove protocol and trailing slash)
      const cleanDomain = editingWebsite.domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const updatedWebsite = {...editingWebsite, domain: cleanDomain};
      
      const updatedWebsites = websites.map(w => 
        w.domain === editingWebsiteOriginalDomain ? updatedWebsite : w
      );
      setWebsites(updatedWebsites);
      saveWebsitesToStorage(updatedWebsites);
      
      // Update selected websites if domain changed
      if (editingWebsiteOriginalDomain !== cleanDomain) {
        setSelectedWebsites(prev => 
          prev.map(d => d === editingWebsiteOriginalDomain ? cleanDomain : d)
        );
      }
      
      setShowEditWebsite(false);
      setEditingWebsite(null);
      setEditingWebsiteOriginalDomain('');
      console.log('Website updated:', updatedWebsite);
    }
  };

  const handleDeleteWebsite = (domain: string) => {
    if (confirm(`Are you sure you want to delete ${domain}? This action cannot be undone.`)) {
      const updatedWebsites = websites.filter(w => w.domain !== domain);
      setWebsites(updatedWebsites);
      saveWebsitesToStorage(updatedWebsites);
      
      // Also remove from selected websites if it was selected
      setSelectedWebsites(prev => prev.filter(d => d !== domain));
      // Remove custom context if exists
      aiService.removeCustomContext(domain);
      loadCustomContexts();
      console.log('Website deleted:', domain);
    }
  };

  const handleStartAutomation = async () => {
    if (selectedWebsites.length === 0) {
      alert('Please select at least one website');
      return;
    }

    setStatus('🤖 Generating AI-powered keywords...');

    try {
      // Generate AI keywords for all selected websites
      const generatedKeywords = await aiService.generateMultiWebsiteKeywords(
        selectedWebsites,
        recipeTheme.trim() || 'recipes', // Use theme if provided, otherwise default to 'recipes'
        1 // Just get the best keyword for each website
      );

      // Get the selected websites data with AI-generated keywords
      const selectedWebsiteData = selectedWebsites.map(domain => {
        const baseWebsite = websites.find(w => w.domain === domain);
        if (!baseWebsite) return null;

        // Use AI-generated keyword if available, otherwise fall back to original
        const aiKeywords = generatedKeywords.get(domain);
        const keyword = aiKeywords && aiKeywords.length > 0 ? aiKeywords[0].keyword : baseWebsite.keyword;

        return {
          ...baseWebsite,
          keyword,
          originalKeyword: baseWebsite.keyword,
          aiGenerated: !!aiKeywords
        };
      }).filter(Boolean);

      // Create JSON string for copying
      const jsonData = JSON.stringify(selectedWebsiteData, null, 2);
      const command = `node run-from-netlify.js '${JSON.stringify(selectedWebsiteData)}'`;
      
      // Show the JSON data in a copyable format
      setStatus(`🤖 AI-Powered Search Configuration:

${recipeTheme ? `Recipe Theme: "${recipeTheme}"` : 'General recipe search (no specific theme)'}
Websites: ${selectedWebsites.length}

Generated Keywords:
${Array.from(generatedKeywords.entries()).map(([domain, keywords]) => 
  `${domain}: ${keywords[0]?.keyword || 'Using original keyword'}`
).join('\n')}

Command to run:
${command}

JSON Data:
${jsonData}`);

    } catch (error) {
      console.error('Error generating AI keywords:', error);
      setStatus('❌ Error generating AI keywords. Using original keywords instead.');
      
      // Fallback to original functionality
      const selectedWebsiteData = selectedWebsites.map(domain => 
        websites.find(w => w.domain === domain)
      ).filter(Boolean);

      const jsonData = JSON.stringify(selectedWebsiteData, null, 2);
      const command = `node run-from-netlify.js '${JSON.stringify(selectedWebsiteData)}'`;
      
      setStatus(`Copy this JSON data and run it on your local machine:

${jsonData}

Command to run:
${command}`);
    }
  };

  const handleCopyCommand = async () => {
    if (selectedWebsites.length === 0) {
      alert('Please select at least one website first');
      return;
    }

    setStatus('🤖 Generating AI-powered keywords...');

    try {
      // Generate AI keywords for all selected websites
      const generatedKeywords = await aiService.generateMultiWebsiteKeywords(
        selectedWebsites,
        recipeTheme.trim() || 'recipes',
        1
      );

      // Get the selected websites data with AI-generated keywords
      const selectedWebsiteData = selectedWebsites.map(domain => {
        const baseWebsite = websites.find(w => w.domain === domain);
        if (!baseWebsite) return null;

        const aiKeywords = generatedKeywords.get(domain);
        const keyword = aiKeywords && aiKeywords.length > 0 ? aiKeywords[0].keyword : baseWebsite.keyword;

        return {
          ...baseWebsite,
          keyword,
          originalKeyword: baseWebsite.keyword,
          aiGenerated: !!aiKeywords
        };
      }).filter(Boolean);

      const command = `node run-from-netlify.js '${JSON.stringify(selectedWebsiteData)}'`;
      
      try {
        await navigator.clipboard.writeText(command);
        setStatus(`✅ AI-powered command copied to clipboard! Paste it in your terminal.

Generated Keywords:
${Array.from(generatedKeywords.entries()).map(([domain, keywords]) => 
  `${domain}: ${keywords[0]?.keyword || 'Using original keyword'}`
).join('\n')}`);
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = command;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setStatus(`✅ AI-powered command copied to clipboard! Paste it in your terminal.

Generated Keywords:
${Array.from(generatedKeywords.entries()).map(([domain, keywords]) => 
  `${domain}: ${keywords[0]?.keyword || 'Using original keyword'}`
).join('\n')}`);
      }
    } catch (error) {
      console.error('Error generating AI keywords:', error);
      setStatus('❌ Error generating AI keywords. Using original keywords instead.');
      
      // Fallback to original functionality
      const selectedWebsiteData = selectedWebsites.map(domain => 
        websites.find(w => w.domain === domain)
      ).filter(Boolean);

      const command = `node run-from-netlify.js '${JSON.stringify(selectedWebsiteData)}'`;
      
      try {
        await navigator.clipboard.writeText(command);
        setStatus('✅ Command copied to clipboard! Paste it in your terminal.');
      } catch (err) {
        const textArea = document.createElement('textarea');
        textArea.value = command;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setStatus('✅ Command copied to clipboard! Paste it in your terminal.');
      }
    }
  };

  // Filter websites based on search term
  const filteredWebsites = websites.filter(website =>
    website.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    website.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '1.5rem',
      marginBottom: '1.5rem'
    },
    button: {
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
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
    input: {
      width: '100%',
      padding: '0.5rem 0.75rem',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '14px'
    },
    websiteCard: {
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1rem',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    selectedCard: {
      borderColor: '#3b82f6',
      backgroundColor: '#eff6ff'
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1a1a1a' }}>
        Recipe Keyword Automation Dashboard
      </h1>

      {/* Control Panel */}
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a1a1a' }}>Control Panel</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              style={{...styles.button, ...styles.secondaryButton}}
              onClick={() => {
                setShowAddWebsite(!showAddWebsite);
                if (!showAddWebsite) {
                  // If opening add form, close edit form
                  setShowEditWebsite(false);
                  setEditingWebsite(null);
                  setEditingWebsiteOriginalDomain('');
                }
              }}
            >
              Add New Website
            </button>
            <button 
              style={{...styles.button, ...styles.secondaryButton, opacity: selectedWebsites.length === 0 ? 0.5 : 1}}
              onClick={handleStartAutomation}
              disabled={selectedWebsites.length === 0}
            >
              Show Command
            </button>
            <button 
              style={{...styles.button, ...styles.primaryButton, opacity: selectedWebsites.length === 0 ? 0.5 : 1}}
              onClick={handleCopyCommand}
              disabled={selectedWebsites.length === 0}
            >
              📋 Copy Command
            </button>
            <button 
              style={{...styles.button, ...styles.secondaryButton}}
              onClick={() => setShowCSVUpload(!showCSVUpload)}
            >
              📁 CSV Upload
            </button>
            <button 
              style={{...styles.button, ...styles.secondaryButton}}
              onClick={() => setShowKeywordTable(!showKeywordTable)}
            >
              📊 Keywords
            </button>
          </div>
        </div>

        {/* Recipe Theme Input */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            marginBottom: '0.5rem', 
            display: 'block',
            color: '#374151'
          }}>
            Recipe Theme (Optional)
          </label>
          <input
            type="text"
            style={styles.input}
            placeholder="e.g., thanksgiving, summer BBQ, healthy breakfast... (leave empty for general recipes)"
            value={recipeTheme}
            onChange={(e) => setRecipeTheme(e.target.value)}
          />
          <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.5rem' }}>
            AI will generate contextually relevant keywords based on this theme for each selected website
          </p>
        </div>

        {/* Add Website Form */}
        {showAddWebsite && (
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#1a1a1a' }}>
              Add New Website
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block', color: '#374151' }}>Domain</label>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="example.com"
                  value={newWebsite.domain}
                  onChange={(e) => setNewWebsite({...newWebsite, domain: e.target.value})}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block', color: '#374151' }}>Search Keyword</label>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="recipe keyword"
                  value={newWebsite.keyword}
                  onChange={(e) => setNewWebsite({...newWebsite, keyword: e.target.value})}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block', color: '#374151' }}>Weekly Quota</label>
                <input
                  type="number"
                  style={styles.input}
                  value={newWebsite.quota}
                  onChange={(e) => setNewWebsite({...newWebsite, quota: parseInt(e.target.value) || 30})}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button 
                  style={{...styles.button, ...styles.primaryButton}}
                  onClick={handleAddWebsite}
                >
                  Add Website
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Website Form */}
        {isClient && showEditWebsite && editingWebsite && (
          <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fdba74', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: '#1a1a1a' }}>
              Edit Website: {editingWebsite.domain}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block', color: '#374151' }}>Domain</label>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="example.com"
                  value={editingWebsite.domain}
                  onChange={(e) => setEditingWebsite({...editingWebsite, domain: e.target.value})}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block', color: '#374151' }}>Search Keyword</label>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="recipe keyword"
                  value={editingWebsite.keyword}
                  onChange={(e) => setEditingWebsite({...editingWebsite, keyword: e.target.value})}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block', color: '#374151' }}>Weekly Quota</label>
                <input
                  type="number"
                  style={styles.input}
                  value={editingWebsite.quota}
                  onChange={(e) => setEditingWebsite({...editingWebsite, quota: parseInt(e.target.value) || 30})}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <button 
                  style={{...styles.button, ...styles.secondaryButton}}
                  onClick={() => {
                    setShowEditWebsite(false);
                    setEditingWebsite(null);
                    setEditingWebsiteOriginalDomain('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  style={{...styles.button, ...styles.primaryButton}}
                  onClick={handleSaveEditWebsite}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        {status && (
          <div style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            {status}
          </div>
        )}

        {/* Selection Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button style={{...styles.button, ...styles.secondaryButton}} onClick={handleSelectAll}>
              Select All ({websites.filter(w => w.active).length})
            </button>
            <button style={{...styles.button, ...styles.secondaryButton}} onClick={handleDeselectAll}>
              Clear Selection
            </button>
            <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
              {selectedWebsites.length} websites selected
            </span>
          </div>
          <input
            type="text"
            style={{...styles.input, width: '300px'}}
            placeholder="Search websites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Website Grid */}
      <div style={styles.card}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1a1a1a' }}>
          Available Websites ({filteredWebsites.length})
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
          {filteredWebsites.map((website) => (
            <div
              key={website.domain}
              style={{
                ...styles.websiteCard,
                ...(selectedWebsites.includes(website.domain) ? styles.selectedCard : {})
              }}
              onClick={() => isClient && handleSelectWebsite(website.domain)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ fontWeight: '600', margin: 0, color: '#1a1a1a', fontSize: '1rem' }}>{website.domain}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isClient && (
                    <>
                      <button
                        style={{
                          background: 'none',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          padding: '0.25rem 0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          color: '#6b7280'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('🔍 Edit button clicked for:', website.domain);
                          handleEditWebsite(website);
                        }}
                        title="Edit website"
                      >
                        ✏️
                      </button>
                      <button
                        style={{
                          background: 'none',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          padding: '0.25rem 0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          color: '#6b7280'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditContext(website.domain);
                        }}
                        title="Edit context"
                      >
                        ⚙️
                      </button>
                      <button
                        style={{
                          background: 'none',
                          border: '1px solid #ef4444',
                          borderRadius: '4px',
                          padding: '0.25rem 0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          color: '#ef4444'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWebsite(website.domain);
                        }}
                        title="Delete website"
                      >
                        🗑️
                      </button>
                      <input
                        type="checkbox"
                        checked={selectedWebsites.includes(website.domain)}
                        onChange={() => handleSelectWebsite(website.domain)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: 'pointer' }}
                      />
                    </>
                  )}
                </div>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.25rem' }}>
                Keyword: {website.keyword}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                Weekly quota: {website.quota} recipes
              </p>
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: website.active ? '#d1fae5' : '#f3f4f6',
                  color: website.active ? '#065f46' : '#4b5563'
                }}>
                  {website.active ? 'Active' : 'Inactive'}
                </span>
                {customContexts.has(website.domain) && (
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af'
                  }}>
                    Custom Context
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CSV Upload Portal */}
      {showCSVUpload && (
        <div style={styles.card}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1a1a1a' }}>
            CSV Upload Portal
          </h2>
          <CSVUploadPortal 
            availableWebsites={websites.map(w => ({
              domain: w.domain,
              name: w.domain,
              keyword: w.keyword
            }))}
            onUploadComplete={(results) => {
              console.log('CSV upload completed:', results);
              // Refresh websites after upload
              setWebsites(prev => [...prev]);
            }}
          />
        </div>
      )}

      {/* Keyword Table Display */}
      {showKeywordTable && (
        <div style={styles.card}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1a1a1a' }}>
            Keyword Table Display
          </h2>
          <KeywordTableDisplay 
            websites={websites}
            recipeTheme={recipeTheme}
            onCopyKeyword={(keyword) => {
              navigator.clipboard.writeText(keyword);
              setStatus(`Copied keyword: ${keyword}`);
            }}
            onExportCSV={() => {
              const csvContent = "data:text/csv;charset=utf-8," 
                + "Domain,Keyword,Quota,Active\n"
                + websites.map(w => `${w.domain},${w.keyword},${w.quota},${w.active}`).join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "websites.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setStatus('CSV exported successfully');
            }}
          />
        </div>
      )}

      {/* Context Editor Modal */}
      <ContextEditorModal
        isOpen={contextEditorOpen}
        onClose={() => setContextEditorOpen(false)}
        domain={editingDomain}
        currentContext={editingDomain ? customContexts.get(editingDomain) || null : null}
        onSave={handleSaveContext}
        onDelete={handleDeleteContext}
      />
    </div>
  );
}
