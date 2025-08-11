import React, { useState, useEffect } from 'react';
// Global baseline and theme styles are now applied via index.css, so the AppTheme dependency has been removed.
import AppAppBar from '../components/Recs/AppAppBar.jsx';
import Footer from '../components/Recs/Footer.jsx';
import SectionForm from '../components/report-builder/SectionForm.jsx';
import SaveTemplateDialog from '../components/report-builder/SaveTemplateDialog.jsx';
import { saveTemplate as apiSaveTemplate, fetchTemplates, archiveTemplate, fetchTemplateById } from '../api.js';

/*
  ReportBuilderPage (Rewritten Version)
  --------------------------------------
  This version completely removes Material UI and the AppTheme dependency.
  Global baseline styles and theme settings are applied via index.css.
  Other Material UI components have been replaced with plain HTML elements and inline styles.
*/

const TemplateManager = React.memo(({ 
  showArchived, 
  onShowArchivedChange, 
  templates, 
  selectedTemplate, 
  onTemplateSelect, 
  onArchive, 
  loading 
}) => {
  // Pre-calculate maximum width for template names to prevent layout shifts
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#242424',
    borderRadius: '8px',
    border: '1px solid #333',
    width: '100%',
    minHeight: '120px',
    position: 'relative',
    isolation: 'isolate'
  };

  const selectContainerStyle = {
    flexGrow: 1,
    width: '100%',
    minWidth: '300px',
    maxWidth: '800px',
    position: 'relative',
    height: '40px',
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    borderRadius: '4px',
    zIndex: 1
  };

  const selectStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: '8px',
    borderRadius: '4px',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    border: '1px solid #646cff',
    width: '100%',
    height: '100%',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
    boxSizing: 'border-box',
    outline: 'none',
    backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    backgroundSize: '12px auto',
    paddingRight: '32px'
  };

  const buttonContainerStyle = {
    width: '120px',
    minWidth: '120px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // Remove opacity transitions
  };

  return (
    <div style={containerStyle}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: '16px',
        width: '100%',
        position: 'relative',
        zIndex: 2
      }}>
        <span style={{ 
          color: '#fff', 
          fontWeight: 'bold',
          minWidth: 'fit-content'
        }}>
          Template Selection
        </span>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginLeft: 'auto',
          minWidth: 'fit-content'
        }}>
          <input
            type="checkbox"
            checked={showArchived}
            onChange={onShowArchivedChange}
            style={{ margin: 0 }}
            disabled={loading}
          />
          Show Archived
        </label>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '16px',
        alignItems: 'center',
        width: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={selectContainerStyle}>
          <select
            value={selectedTemplate?.template_id || ''}
            onChange={(e) => onTemplateSelect(e.target.value)}
            disabled={loading}
            style={selectStyle}
          >
            <option value="">Select Template</option>
            {templates.map(template => (
              <option key={template.template_id} value={template.template_id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>

        <div style={buttonContainerStyle}>
          {selectedTemplate && (
            <button
              onClick={() => onArchive(selectedTemplate.template_id)}
              disabled={loading}
              style={{
                padding: '8px 16px',
                border: '1px solid #646cff',
                borderRadius: '4px',
                backgroundColor: '#1a1a1a',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                width: '100%',
                height: '100%',
                // Remove opacity transitions
              }}
            >
              {showArchived ? 'Unarchive' : 'Archive'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Add custom comparison to prevent unnecessary re-renders
  return (
    prevProps.showArchived === nextProps.showArchived &&
    prevProps.loading === nextProps.loading &&
    prevProps.templates === nextProps.templates &&
    prevProps.selectedTemplate?.template_id === nextProps.selectedTemplate?.template_id
  );
});

const ReportBuilderPage = (props) => {
  // State for the top-level sections that make up the template.
  const [sections, setSections] = useState([
    { sectionTitle: '', articleTitle: '', command: '', subsections: [] }
  ]);
  // State to control the open/closed state of the save dialog.
  const [openDialog, setOpenDialog] = useState(false);
  // State for the template name and description.
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  // State for displaying a confirmation or error message.
  const [saveMessage, setSaveMessage] = useState('');
  // State for template management
  const [templates, setTemplates] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('session_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
  }, []);

  // Fetch templates on component mount and when showArchived changes
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setError(null);
        setLoading(true);
        const response = await fetchTemplates({ archived: showArchived });
        setTemplates(response.templates || []);
      } catch (error) {
        if (error.message !== 'Session expired. Please log in again.') {
          setError('Failed to load templates. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
    loadTemplates();
  }, [showArchived]);

  const handleNewTemplate = () => {
    setSelectedTemplate(null);
    setSections([{ sectionTitle: '', articleTitle: '', command: '', subsections: [] }]);
    setTemplateName('');
    setTemplateDescription('');
    setSaveMessage('');
  };

  const handleTemplateSelect = async (templateId) => {
    if (!templateId) {
      handleNewTemplate();
      return;
    }
    try {
      setError(null);
      setLoading(true);
      const template = await fetchTemplateById(templateId);
      if (template) {
        // Transform the sections to use camelCase
        const transformSection = (section) => ({
          sectionTitle: section.section_title,
          articleTitle: section.article_title,
          command: section.command,
          subsections: section.subsections?.map(transformSection) || []
        });
  
        const transformedSections = template.sections?.map(transformSection) || 
          [{ sectionTitle: '', articleTitle: '', command: '', subsections: [] }];
  
        setSections(transformedSections);
        setSelectedTemplate(template);
        setTemplateName(template.name || '');
        setTemplateDescription(template.description || '');
      }
    } catch (error) {
      if (error.message !== 'Session expired. Please log in again.') {
        setError('Failed to load template. Please try again later.');
        handleNewTemplate();
      }
    } finally {
      setLoading(false);
    }
  };
  const handleArchiveTemplate = async (templateId) => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      await archiveTemplate(templateId, !showArchived);
      // Refresh templates list
      const response = await fetchTemplates({ archived: showArchived });
      setTemplates(response.templates || []);
      
      // Clear the form state, similar to handleNewTemplate
      setSelectedTemplate(null);
      setSections([{ sectionTitle: '', articleTitle: '', command: '', subsections: [] }]);
      setTemplateName('');
      setTemplateDescription('');
      setSaveMessage('');
      
    } catch (error) {
      console.error('Error archiving template:', error);
      setError(error.response?.data?.detail || 'Failed to archive template. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  /**
   * updateSection
   * Updates a top-level section at the specified index.
   */
  const updateSection = (index, newSection) => {
    const updatedSections = [...sections];
    updatedSections[index] = newSection;
    setSections(updatedSections);
  };

  /**
   * addSection
   * Adds a new top-level section to the template.
   */
  const addSection = () => {
    setSections([
      ...sections,
      { sectionTitle: '', articleTitle: '', command: '', subsections: [] }
    ]);
  };

  /**
   * removeSection
   * Removes the top-level section at the specified index.
   */
  const removeSection = (index) => {
    const updatedSections = sections.filter((_, i) => i !== index);
    setSections(updatedSections);
  };

  /**
   * handleSaveComplete
   * Handles the completion of saving the template.
   */
  const handleSaveComplete = (message) => {
    setSaveMessage(message);
    // Refresh templates list after saving
    fetchTemplates({ archived: showArchived })
      .then(response => setTemplates(response.templates || []))
      .catch(error => console.error('Error refreshing templates:', error));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppAppBar />
      <main className="page-content">
        <div className="layout-wrapper">
          {error && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#ff00001a', 
              color: '#ff0000', 
              borderRadius: '4px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '16px',
            marginBottom: '24px',
            marginTop: '120px'  // Add top margin to account for fixed AppBar
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
            }}>
              <h4 style={{
                margin: 0,  // Reset default margins
                fontSize: '32px',  // Match other pages' heading size
                fontWeight: 'bold'
              }}>Report Builder</h4>
              <button
                onClick={handleNewTemplate}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #646cff',
                  borderRadius: '4px',
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                New Template
              </button>
            </div>

            {/* Template Management Section */}
            <TemplateManager
              showArchived={showArchived}
              onShowArchivedChange={(e) => setShowArchived(e.target.checked)}
              templates={templates}
              selectedTemplate={selectedTemplate}
              onTemplateSelect={handleTemplateSelect}
              onArchive={handleArchiveTemplate}
              loading={loading}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
          ) : (
            <>
              {sections.map((section, index) => (
                <SectionForm
                  key={index}
                  section={section}
                  onChange={(newSection) => updateSection(index, newSection)}
                  onAddSubsection={addSection}
                  onDelete={() => removeSection(index)}
                />
              ))}

              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                marginTop: '16px',
                marginBottom: '32px'
              }}>
                <button
                  onClick={addSection}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                    color: 'black',
                    cursor: 'pointer'
                  }}
                >
                  Add New Section
                </button>
                <button
                  onClick={() => setOpenDialog(true)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #fff',
                    borderRadius: '4px',
                    backgroundColor: '#1a1a1a',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Save Template
                </button>
              </div>
              
              {saveMessage && (
                <p style={{ 
                  marginTop: '16px', 
                  marginBottom: '32px',
                  color: 'green' 
                }}>
                  {saveMessage}
                </p>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />

      <SaveTemplateDialog
        isOpen={openDialog}
        onClose={() => setOpenDialog(false)}
        sections={sections}
        onSaveComplete={handleSaveComplete}
        existingTemplate={selectedTemplate}
      />
    </div>
  );
};

export default ReportBuilderPage;
