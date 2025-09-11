'use client';

import React, { useState, useEffect } from 'react';
import { WebsiteData } from '../types';

// Import all websites data
import allWebsitesData from '../../data/all-websites.json';

export default function AutomationDashboard() {
  const [websites, setWebsites] = useState<WebsiteData[]>([]);
  const [selectedWebsites, setSelectedWebsites] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [showAddWebsite, setShowAddWebsite] = useState(false);
  const [newWebsite, setNewWebsite] = useState({
    domain: '',
    keyword: '',
    quota: 30,
    active: true
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Load websites from the JSON file
    const loadedWebsites = allWebsitesData.websites.map(site => ({
      domain: site.domain,
      keyword: site.keyword,
      quota: site.quota,
      active: site.active
    }));
    setWebsites(loadedWebsites);
  }, []);

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
      
      setWebsites(prev => [...prev, websiteToAdd]);
      setNewWebsite({ domain: '', keyword: '', quota: 30, active: true });
      setShowAddWebsite(false);
      
      // TODO: Save to backend/database
      console.log('Website added:', websiteToAdd);
    }
  };

  const handleStartAutomation = async () => {
    if (selectedWebsites.length === 0) {
      alert('Please select at least one website');
      return;
    }

    setIsRunning(true);
    setStatus('Starting automation...');

    try {
      // Call the Hetzner backend directly
      const response = await fetch('http://178.156.141.138:3001/api/automation/start-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websites: selectedWebsites.map(domain => 
            websites.find(w => w.domain === domain)
          ).filter(Boolean)
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Handle different response formats
        const statusMessage = data.details?.note 
          ? `${data.message}. ${data.details.note}`
          : data.message || 'Automation started successfully';
        setStatus(statusMessage);
      } else {
        setStatus(`Error: ${data.error || data.details || 'Failed to start automation'}`);
      }
    } catch (error) {
      setStatus('Error: ' + error);
    } finally {
      setIsRunning(false);
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
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Recipe Keyword Automation Dashboard
      </h1>

      {/* Control Panel */}
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Control Panel</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              style={{...styles.button, ...styles.secondaryButton}}
              onClick={() => setShowAddWebsite(!showAddWebsite)}
            >
              Add New Website
            </button>
            <button 
              style={{...styles.button, ...styles.primaryButton, opacity: isRunning || selectedWebsites.length === 0 ? 0.5 : 1}}
              onClick={handleStartAutomation}
              disabled={isRunning || selectedWebsites.length === 0}
            >
              {isRunning ? 'Running...' : 'Start Automation'}
            </button>
          </div>
        </div>

        {/* Add Website Form */}
        {showAddWebsite && (
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
              Add New Website
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>Domain</label>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="example.com"
                  value={newWebsite.domain}
                  onChange={(e) => setNewWebsite({...newWebsite, domain: e.target.value})}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>Search Keyword</label>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="recipe keyword"
                  value={newWebsite.keyword}
                  onChange={(e) => setNewWebsite({...newWebsite, keyword: e.target.value})}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', display: 'block' }}>Weekly Quota</label>
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
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
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
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
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
              onClick={() => handleSelectWebsite(website.domain)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ fontWeight: '500', margin: 0 }}>{website.domain}</h3>
                <input
                  type="checkbox"
                  checked={selectedWebsites.includes(website.domain)}
                  onChange={() => handleSelectWebsite(website.domain)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ cursor: 'pointer' }}
                />
              </div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Keyword: {website.keyword}
              </p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Weekly quota: {website.quota} recipes
              </p>
              <div style={{ marginTop: '0.5rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: website.active ? '#d1fae5' : '#f3f4f6',
                  color: website.active ? '#065f46' : '#6b7280'
                }}>
                  {website.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
