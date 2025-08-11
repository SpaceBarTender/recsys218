// Rewritten SectionForm.jsx without Material UI.
// All styling and components have been replaced with plain HTML elements and inline styles,
// while maintaining similar spatial and aesthetic formatting.

import React, { useState, useEffect } from 'react';
import { fetchAddedPagesDetails } from '../../api.js'; // Adjust path as needed

// Replacing Material UI's TabPanel with a plain HTML version.
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      {...other}
      style={{
        display: value === index ? 'block' : 'none',
        paddingTop: value === index ? '16px' : '0',
      }}
    >
      {children}
    </div>
  );
}

function SectionForm({ section, onChange, onAddSubsection, onAddSibling, onDelete }) {
  // Manage the current active tab for nested subsections.
  const [tabIndex, setTabIndex] = useState(0);
  // State for fetched article titles.
  const [articleTitles, setArticleTitles] = useState([]);

  // Fetch article titles when the component mounts.
  useEffect(() => {
    fetchAddedPagesDetails()
      .then(response => {
        const data = response.data || response;
        if (data && data.added_pages) {
          const titles = data.added_pages.map(page => page.title);
          setArticleTitles(titles);
        } else {
          console.error("Unexpected response structure", data);
        }
      })
      .catch(error => {
        console.error("Error fetching article titles:", error);
      });
  }, []);

  // Update a field in the current section.
  const handleFieldChange = (field, value) => {
    onChange({ ...section, [field]: value });
  };

  // Adds a new nested subsection (child) to the current section.
  const handleAddNestedSubsection = () => {
    const newSubsection = { sectionTitle: '', articleTitle: '', command: '', subsections: [] };
    const updatedSubsections = section.subsections ? [...section.subsections, newSubsection] : [newSubsection];
    onChange({ ...section, subsections: updatedSubsections });
    setTabIndex(updatedSubsections.length - 1);
  };

  // Update one of the nested subsections.
  const handleNestedSubChange = (index, newSubsection) => {
    const updatedSubsections = section.subsections.map((sub, i) => (i === index ? newSubsection : sub));
    onChange({ ...section, subsections: updatedSubsections });
  };

  // Remove a nested subsection.
  const handleDeleteNestedSubsection = (index) => {
    const updatedSubsections = section.subsections.filter((_, i) => i !== index);
    onChange({ ...section, subsections: updatedSubsections });
    setTabIndex(0);
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    // Replacing MUI's Card component with a plain div styled as a card.
    <div style={{
      margin: '16px 0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
      position: 'relative',
      paddingTop: '16px',
      borderRadius: '4px',
      backgroundColor: '#333',
      color: 'rgba(255,255,255,0.87)'
    }}>
      {/* Replacing MUI's IconButton with a simple button for deletion */}
      {onDelete && (
        <button
          onClick={onDelete}
          style={{
            position: 'absolute',
            top: '12px',
            right: '4px',
            zIndex: 1,
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            width: '32px',
            height: '32px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '0'
          }}
          title="Delete Section"
        >
          X
        </button>
      )}
      
      {/* Replacing MUI's CardContent with a plain div */}
      <div style={{ padding: '16px' }}>
        {/* Flex container to mimic MUI Grid container with spacing */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
          {/* Section Title Input */}
          <div style={{ flex: '1 1 calc(33.33% - 16px)', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: 'rgba(255,255,255,0.87)' }}>Section Title</label>
            <input
              type="text"
              value={section.sectionTitle}
              onChange={(e) => handleFieldChange('sectionTitle', e.target.value)}
              placeholder="Section Title"
              style={{
                width: '100%',
                padding: '8px',
                boxSizing: 'border-box',
                backgroundColor: '#424242',
                color: 'rgba(255,255,255,0.87)',
                border: '1px solid #555',
                borderRadius: '4px'
              }}
            />
          </div>
          
          {/* Article Title Dropdown */}
          <div style={{ flex: '1 1 calc(33.33% - 16px)', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: 'rgba(255,255,255,0.87)' }}>Article Title</label>
            <select
              value={section.articleTitle || ''}
              onChange={(e) => handleFieldChange('articleTitle', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                boxSizing: 'border-box',
                backgroundColor: '#424242',
                color: 'rgba(255,255,255,0.87)',
                border: '1px solid #555',
                borderRadius: '4px'
              }}
            >
              <option value="">None</option>
              {articleTitles.map((title, index) => (
                <option key={index} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>
          
          {/* Command Input */}
          <div style={{ flex: '1 1 calc(33.33% - 16px)', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: 'rgba(255,255,255,0.87)' }}>Command</label>
            <input
              type="text"
              value={section.command}
              onChange={(e) => handleFieldChange('command', e.target.value)}
              placeholder="Command"
              style={{
                width: '100%',
                padding: '8px',
                boxSizing: 'border-box',
                backgroundColor: '#424242',
                color: 'rgba(255,255,255,0.87)',
                border: '1px solid #555',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
          <button
            onClick={handleAddNestedSubsection}
            style={{
              padding: '8px 16px',
              border: '1px solid #555',
              borderRadius: '4px',
              backgroundColor: '#1a1a1a',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Add Subsection
          </button>
          {onAddSibling && (
            <button
              onClick={onAddSibling}
              style={{
                padding: '8px 16px',
                border: '1px solid #555',
                borderRadius: '4px',
                backgroundColor: '#1a1a1a',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              Add Sibling Section
            </button>
          )}
        </div>
        
        {/* Render nested subsections as a vertical, indented list */}
        {section.subsections && section.subsections.length > 0 && (
          <div style={{
            marginTop: '16px',
            marginLeft: '24px',
            borderLeft: '2px dashed #555',
            paddingLeft: '16px'
          }}>
            {section.subsections.map((sub, index) => (
              <SectionForm
                key={index}
                section={sub}
                onChange={(newSub) => handleNestedSubChange(index, newSub)}
                onDelete={() => handleDeleteNestedSubsection(index)}
                onAddSibling={() => {
                  const newSibling = { sectionTitle: '', articleTitle: '', command: '', subsections: [] };
                  const updatedSubs = [...section.subsections];
                  updatedSubs.splice(index + 1, 0, newSibling);
                  onChange({ ...section, subsections: updatedSubs });
                }}
                onAddSubsection={handleAddNestedSubsection}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SectionForm;
