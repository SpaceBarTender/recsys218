-- Add foreign key constraints
ALTER TABLE templates 
    ADD CONSTRAINT templates_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(user_id);

ALTER TABLE templates 
    ADD CONSTRAINT templates_archived_by_fkey 
    FOREIGN KEY (archived_by) REFERENCES users(user_id);

ALTER TABLE template_history 
    ADD CONSTRAINT template_history_modified_by_fkey 
    FOREIGN KEY (modified_by) REFERENCES users(user_id);

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON templates(created_by);
CREATE INDEX IF NOT EXISTS idx_templates_archived ON templates(is_archived);
CREATE INDEX IF NOT EXISTS idx_template_sections_template_id ON template_sections(template_id);
CREATE INDEX IF NOT EXISTS idx_template_sections_parent ON template_sections(parent_section_id);
CREATE INDEX IF NOT EXISTS idx_template_history_template_id ON template_history(template_id); 