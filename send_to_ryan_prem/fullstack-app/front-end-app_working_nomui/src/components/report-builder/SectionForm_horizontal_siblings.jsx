import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Box,
  Tabs,
  Tab
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// Simple TabPanel component for nested subsections
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

function SectionForm({ section, onChange, onAddSubsection, onDelete }) {
  // For nested subsections, manage the current active tab.
  const [tabIndex, setTabIndex] = useState(0);

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
    const updatedSubsections = section.subsections.map((sub, i) =>
      i === index ? newSubsection : sub
    );
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
    <Card
      sx={{
        my: 2,
        boxShadow: 3,
        position: 'relative',
        pt: 2,
      }}
    >
      {onDelete && (
        <IconButton
          onClick={onDelete}
          size="small"
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            zIndex: 1,
            bgcolor: 'rgba(255,255,255,0.8)',
            color: 'error.main',
            '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
      <CardContent sx={{ pt: 3 }}>
        <Grid container spacing={2}>
          {/* Section Title Input */}
          <Grid item xs={12} sm={4}>
            <TextField
              label="Section Title"
              variant="outlined"
              fullWidth
              size="small"
              value={section.sectionTitle}
              onChange={(e) => handleFieldChange('sectionTitle', e.target.value)}
            />
          </Grid>
          {/* Article Title Dropdown */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>Article Title</InputLabel>
              <Select
                label="Article Title"
                value={section.articleTitle || ''}
                onChange={(e) => handleFieldChange('articleTitle', e.target.value)}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {/* Replace with dynamic options */}
                <MenuItem value="Article 1">Article 1</MenuItem>
                <MenuItem value="Article 2">Article 2</MenuItem>
                <MenuItem value="Article 3">Article 3</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {/* Command Input */}
          <Grid item xs={12} sm={4}>
            <TextField
              label="Command"
              variant="outlined"
              fullWidth
              size="small"
              value={section.command}
              onChange={(e) => handleFieldChange('command', e.target.value)}
            />
          </Grid>
        </Grid>
        {/* Button to add a nested subsection (child) */}
        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={handleAddNestedSubsection}>
            Add Subsection
          </Button>
        </Box>
        {/* If nested subsections exist, display them in tabs */}
        {section.subsections && section.subsections.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Tabs value={tabIndex} onChange={handleTabChange}>
              {section.subsections.map((sub, index) => (
                <Tab key={index} label={`Subsection ${index + 1}`} />
              ))}
            </Tabs>
            {section.subsections.map((sub, index) => (
              <TabPanel key={index} value={tabIndex} index={index}>
                <SectionForm
                  section={sub}
                  onChange={(newSub) => handleNestedSubChange(index, newSub)}
                  onDelete={() => handleDeleteNestedSubsection(index)}
                  onAddSubsection={handleAddNestedSubsection}
                />
                {/* Add Sibling Section Button for this nested level */}
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const newSibling = { sectionTitle: '', articleTitle: '', command: '', subsections: [] };
                      const updatedSubs = section.subsections ? [...section.subsections, newSibling] : [newSibling];
                      onChange({ ...section, subsections: updatedSubs });
                      setTabIndex(updatedSubs.length - 1);
                    }}
                  >
                    Add Sibling Section
                  </Button>
                </Box>
              </TabPanel>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default SectionForm;
