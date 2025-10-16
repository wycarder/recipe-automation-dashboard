'use client';

import React, { useState, useRef } from 'react';

interface UploadedFile {
  file: File;
  id: string;
  size: number;
  selectedWebsite?: string; // Individual website mapping per file
}

interface CSVUploadPortalProps {
  onUploadComplete?: (results: any[]) => void;
  availableWebsites?: Array<{domain: string, name: string, keyword: string}>;
}

export default function CSVUploadPortal({ onUploadComplete, availableWebsites = [] }: CSVUploadPortalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug: Log available websites
  React.useEffect(() => {
    console.log('CSVUploadPortal - availableWebsites received:', availableWebsites.length);
    if (availableWebsites.length > 0) {
      console.log('First available website:', availableWebsites[0]);
    } else {
      console.log('⚠️ No websites available in CSVUploadPortal');
    }
  }, [availableWebsites]);


  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '1.5rem',
      marginBottom: '1.5rem'
    },
    header: {
      fontSize: '1.5rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: '#1a1a1a'
    },
    uploadArea: {
      border: '2px dashed #d1d5db',
      borderRadius: '8px',
      padding: '2rem',
      textAlign: 'center' as const,
      backgroundColor: dragActive ? '#f9fafb' : 'white',
      borderColor: dragActive ? '#3b82f6' : '#d1d5db',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    uploadText: {
      fontSize: '1rem',
      color: '#6b7280',
      marginBottom: '0.5rem'
    },
    uploadSubtext: {
      fontSize: '0.875rem',
      color: '#9ca3af'
    },
    fileList: {
      marginTop: '1rem'
    },
    fileItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.75rem',
      backgroundColor: '#f9fafb',
      borderRadius: '6px',
      marginBottom: '0.5rem'
    },
    fileName: {
      fontWeight: '500',
      color: '#374151'
    },
    fileSize: {
      fontSize: '0.875rem',
      color: '#6b7280'
    },
    removeButton: {
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      border: '1px solid #ef4444',
      backgroundColor: 'white',
      color: '#ef4444',
      cursor: 'pointer',
      fontSize: '12px'
    },
    button: {
      padding: '0.75rem 1rem',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s',
      marginTop: '1rem'
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
    disabledButton: {
      backgroundColor: '#f3f4f6',
      color: '#9ca3af',
      cursor: 'not-allowed'
    },
    statusMessage: {
      padding: '1rem',
      borderRadius: '6px',
      marginTop: '1rem',
      fontSize: '14px'
    },
    successStatus: {
      backgroundColor: '#d1fae5',
      color: '#065f46'
    },
    errorStatus: {
      backgroundColor: '#fee2e2',
      color: '#dc2626'
    },
    infoStatus: {
      backgroundColor: '#dbeafe',
      color: '#1e40af'
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const csvFiles = files.filter(file => 
      file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')
    );

    if (csvFiles.length !== files.length) {
      setUploadStatus('⚠️ Only CSV files are allowed. Some files were ignored.');
    }

    const newFiles: UploadedFile[] = csvFiles.map(file => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      size: file.size,
      selectedWebsite: '' // Initialize with empty website selection
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    if (csvFiles.length > 0) {
      setUploadStatus(`✅ Added ${csvFiles.length} CSV file(s). Please map each file to a website below.`);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    if (uploadedFiles.length === 1) {
      setUploadStatus('');
    }
  };

  const updateFileWebsite = (fileId: string, website: string) => {
    setUploadedFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, selectedWebsite: website } : file
    ));
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    setUploadStatus('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUploadToNotion = async () => {
    if (uploadedFiles.length === 0) {
      setUploadStatus('❌ Please upload CSV files first');
      return;
    }

    // Check if all files have websites mapped
    const unmappedFiles = uploadedFiles.filter(file => !file.selectedWebsite);
    if (availableWebsites.length > 0 && unmappedFiles.length > 0) {
      setUploadStatus(`❌ Please select a website for all uploaded files. ${unmappedFiles.length} file(s) still need website mapping.`);
      return;
    }

    setIsUploading(true);
    setUploadStatus(`📤 Processing ${uploadedFiles.length} CSV files and pushing to Notion...`);

    try {
      const results = [];
      let processedCount = 0;
      
      for (const uploadedFile of uploadedFiles) {
        processedCount++;
        setUploadStatus(`📤 Processing file ${processedCount} of ${uploadedFiles.length}: ${uploadedFile.file.name}...`);
        
        const formData = new FormData();
        formData.append('csvFile', uploadedFile.file);
        
        // Get the website data for this specific file
        const websiteData = availableWebsites.length > 0 
          ? availableWebsites.find(w => w.domain === uploadedFile.selectedWebsite)
          : { domain: 'manual-upload', name: 'Manual Upload', keyword: 'manual' };
        
        if (!websiteData) {
          throw new Error(`Website not found for file: ${uploadedFile.file.name}`);
        }
        
        formData.append('website', JSON.stringify({
          domain: websiteData.domain,
          name: websiteData.name,
          active: true
        }));

        const response = await fetch('/api/recipes/upload-csv', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${uploadedFile.file.name}: ${response.statusText}`);
        }

        const result = await response.json();
        results.push({
          fileName: uploadedFile.file.name,
          website: websiteData.name,
          recipesProcessed: result.recipesProcessed || 0,
          rowsProcessed: result.rowsProcessed || 0,
          ...result
        });
        
        // Update progress message
        setUploadStatus(`📤 Processed ${processedCount} of ${uploadedFiles.length} files. Last: ${uploadedFile.file.name} (${result.recipesProcessed || 0} recipes)...`);
      }

      const totalRecipes = results.reduce((sum, result) => sum + (result.recipesProcessed || 0), 0);
      const totalRows = results.reduce((sum, result) => sum + (result.rowsProcessed || 0), 0);
      
      setUploadStatus(`✅ Successfully processed ${results.length} files with ${totalRecipes} recipes (from ${totalRows} CSV rows)! Check your Notion database for the new recipes.`);
      
      if (onUploadComplete) {
        onUploadComplete(results);
      }

      // Clear files after successful upload
      setUploadedFiles([]);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusStyle = () => {
    if (uploadStatus.includes('✅')) return { ...styles.statusMessage, ...styles.successStatus };
    if (uploadStatus.includes('❌')) return { ...styles.statusMessage, ...styles.errorStatus };
    if (uploadStatus.includes('⚠️')) return { ...styles.statusMessage, ...styles.errorStatus };
    return { ...styles.statusMessage, ...styles.infoStatus };
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>📁 Manual CSV Upload Portal</h2>
      
      <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '14px' }}>
        Upload CSV files downloaded from PinClicks to push recipes directly to Notion, bypassing the automation.
      </p>

      {/* Upload Area */}
      <div
        style={styles.uploadArea}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div style={styles.uploadText}>
          📤 Drop CSV files here or click to browse
        </div>
        <div style={styles.uploadSubtext}>
          Only CSV files are accepted
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".csv"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div style={styles.fileList}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
              Uploaded Files & Website Mapping ({uploadedFiles.length})
            </h3>
            <button
              style={{...styles.button, ...styles.secondaryButton, padding: '0.5rem 0.75rem', fontSize: '12px'}}
              onClick={clearAllFiles}
            >
              Clear All
            </button>
          </div>

          {/* Mapping Status */}
          <div style={{ 
            backgroundColor: availableWebsites.length > 0 ? '#f3f4f6' : '#fef2f2', 
            padding: '0.75rem', 
            borderRadius: '6px', 
            marginBottom: '1rem',
            fontSize: '14px',
            color: availableWebsites.length > 0 ? '#374151' : '#dc2626'
          }}>
            {availableWebsites.length > 0 ? (
              (() => {
                const mappedCount = uploadedFiles.filter(f => f.selectedWebsite).length;
                const totalCount = uploadedFiles.length;
                return `${mappedCount} of ${totalCount} files mapped to websites (${availableWebsites.length} websites available)`;
              })()
            ) : (
              '⚠️ No websites available for mapping. Please check website configuration.'
            )}
          </div>

          {/* File Table */}
          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            overflow: 'hidden',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {/* Table Header */}
            <div style={{ 
              backgroundColor: '#f9fafb', 
              padding: '0.75rem', 
              borderBottom: '1px solid #e5e7eb',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr auto',
              gap: '1rem',
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <div>File Name</div>
              <div>Website</div>
              <div>Actions</div>
            </div>

            {/* File Rows */}
            {uploadedFiles.map((uploadedFile) => (
                <div key={uploadedFile.id} style={{ 
                  padding: '0.75rem', 
                  borderBottom: '1px solid #f3f4f6',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr auto',
                  gap: '1rem',
                  alignItems: 'center',
                  backgroundColor: uploadedFile.selectedWebsite ? 'white' : '#fef2f2'
                }}>
                <div>
                  <div style={{ fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                    📄 {uploadedFile.file.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {formatFileSize(uploadedFile.size)}
                  </div>
                </div>
                
                <div>
                  {availableWebsites.length > 0 ? (
                    <div style={{ position: 'relative' }}>
                      <select
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: uploadedFile.selectedWebsite ? '1px solid #10b981' : '1px solid #ef4444',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: 'white',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none'
                        }}
                        value={uploadedFile.selectedWebsite || ''}
                        onChange={(e) => updateFileWebsite(uploadedFile.id, e.target.value)}
                      >
                        <option value="">Select website...</option>
                        {availableWebsites.map((website) => (
                          <option key={website.domain} value={website.domain}>
                            {website.name}
                          </option>
                        ))}
                      </select>
                      {/* Display selected website name */}
                      {uploadedFile.selectedWebsite && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '0.5rem',
                          transform: 'translateY(-50%)',
                          fontSize: '12px',
                          color: '#374151',
                          pointerEvents: 'none',
                          backgroundColor: 'white',
                          padding: '0 0.25rem',
                          maxWidth: 'calc(100% - 1rem)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {availableWebsites.find(w => w.domain === uploadedFile.selectedWebsite)?.name || uploadedFile.selectedWebsite}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                      Manual upload
                    </div>
                  )}
                </div>
                
                <button
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #ef4444',
                    backgroundColor: 'white',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  onClick={() => removeFile(uploadedFile.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      <button
        style={{
          ...styles.button,
          ...(uploadedFiles.length > 0 && (availableWebsites.length === 0 || uploadedFiles.every(f => f.selectedWebsite)) ? styles.primaryButton : styles.disabledButton)
        }}
        onClick={handleUploadToNotion}
        disabled={uploadedFiles.length === 0 || isUploading || (availableWebsites.length > 0 && !uploadedFiles.every(f => f.selectedWebsite))}
      >
        {isUploading ? '⏳ Processing...' : '🚀 Push to Notion'}
      </button>

      {/* Status Message */}
      {uploadStatus && (
        <div style={getStatusStyle()}>
          {uploadStatus}
        </div>
      )}
    </div>
  );
}
