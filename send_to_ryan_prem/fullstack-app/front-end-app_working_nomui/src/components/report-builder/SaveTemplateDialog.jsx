import React, { useState, useEffect } from 'react';
import { saveTemplate as apiSaveTemplate, updateTemplate as apiUpdateTemplate } from '../../api.js';

const SaveTemplateDialog = ({ isOpen, onClose, sections, onSaveComplete, existingTemplate }) => {
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [dialogMessage, setDialogMessage] = useState({ text: '', isError: false });

  // Update form when existingTemplate changes
  useEffect(() => {
    if (existingTemplate) {
      setTemplateName(existingTemplate.name || '');
      setTemplateDescription(existingTemplate.description || '');
    }
  }, [existingTemplate]);

  const handleConfirmSave = async () => {
    const templateData = {
      name: templateName,
      description: templateDescription,
      content: { sections }
    };

    try {
      let response;
      if (existingTemplate) {
        response = await apiUpdateTemplate(
          existingTemplate.template_id,
          templateName,
          templateDescription,
          { sections }
        );
      } else {
        response = await apiSaveTemplate(templateData);
      }

      const successMessage = response.data.message || 'Template saved successfully!';
      setDialogMessage({ text: successMessage, isError: false });
      onSaveComplete(successMessage);
      onClose();
    } catch (error) {
      const errorMessage = 'Error saving template: ' + error.message;
      setDialogMessage({ text: errorMessage, isError: true });
      // Don't close dialog on error so user can try again
    }
  };

  // Reset message when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setDialogMessage({ text: '', isError: false });
      if (!existingTemplate) {
        setTemplateName('');
        setTemplateDescription('');
      }
    }
  }, [isOpen, existingTemplate]);

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#333',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          width: '90%',
          maxWidth: '500px',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ 
          marginBottom: '16px', 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: '#fff' 
        }}>
          {existingTemplate ? 'Update Template' : 'Save Template'}
        </div>
        {dialogMessage.text && (
          <div style={{
            marginBottom: '16px',
            padding: '8px',
            borderRadius: '4px',
            backgroundColor: dialogMessage.isError ? '#2c1212' : '#1b2e1b',
            color: dialogMessage.isError ? '#ff6b6b' : '#4caf50',
            border: `1px solid ${dialogMessage.isError ? '#ff6b6b' : '#4caf50'}`
          }}>
            {dialogMessage.text}
          </div>
        )}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          width: '100%'
        }}>
          <div style={{ width: '100%' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '4px', 
              color: '#fff' 
            }}>
              Template Name
            </label>
            <input
              autoFocus
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #646cff',
                borderRadius: '4px',
                backgroundColor: '#242424',
                color: '#fff',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ width: '100%' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '4px', 
              color: '#fff' 
            }}>
              Template Description
            </label>
            <input
              type="text"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #646cff',
                borderRadius: '4px',
                backgroundColor: '#242424',
                color: '#fff',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '8px', 
          marginTop: '16px',
          width: '100%'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              backgroundColor: '#424242',
              color: '#fff',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSave}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              backgroundColor: '#1a1a1a',
              color: '#fff',
              border: '1px solid #646cff',
              cursor: 'pointer'
            }}
          >
            {existingTemplate ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </>
  );
};

export default SaveTemplateDialog; 