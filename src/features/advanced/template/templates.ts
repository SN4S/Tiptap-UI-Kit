/**
 * Built-in template definitions
 * @description Provides common document templates inserted via toolbar
 */

export interface TemplateItem {
  /** Template unique key */
  key: string
  /** Template name (i18n key) */
  nameKey: string
  /** Template description (i18n key) */
  descKey: string
  /** Template HTML content */
  content: string
}

/**
 * Meeting Minutes template
 */
const meetingMinutes: TemplateItem = {
  key: 'meeting-minutes',
  nameKey: 'editor.templateMeetingMinutes',
  descKey: 'editor.templateMeetingMinutesDesc',
  content: `
<h2>Meeting Minutes</h2>
<table>
  <tr><th>Item</th><th>Content</th></tr>
  <tr><td>Topic</td><td></td></tr>
  <tr><td>Date</td><td></td></tr>
  <tr><td>Attendees</td><td></td></tr>
  <tr><td>Host</td><td></td></tr>
</table>
<h3>Agenda & Discussion</h3>
<ol>
  <li><p></p></li>
</ol>
<h3>Decisions</h3>
<ul>
  <li><p></p></li>
</ul>
<h3>Action Items</h3>
<table>
  <tr><th>Task</th><th>Assignee</th><th>Due Date</th></tr>
  <tr><td></td><td></td><td></td></tr>
  <tr><td></td><td></td><td></td></tr>
</table>
`.trim(),
}

/**
 * Weekly Report template
 */
const weeklyReport: TemplateItem = {
  key: 'weekly-report',
  nameKey: 'editor.templateWeeklyReport',
  descKey: 'editor.templateWeeklyReportDesc',
  content: `
<h2>Weekly Report</h2>
<p><strong>Name:</strong></p>
<p><strong>Date:</strong></p>
<h3>Completed This Week</h3>
<ul>
  <li><p></p></li>
</ul>
<h3>In Progress</h3>
<ul>
  <li><p></p></li>
</ul>
<h3>Next Week Plan</h3>
<ul>
  <li><p></p></li>
</ul>
<h3>Issues & Risks</h3>
<ul>
  <li><p></p></li>
</ul>
`.trim(),
}

/**
 * Project Proposal template
 */
const projectPlan: TemplateItem = {
  key: 'project-plan',
  nameKey: 'editor.templateProjectPlan',
  descKey: 'editor.templateProjectPlanDesc',
  content: `
<h2>Project Proposal</h2>
<h3>1. Project Overview</h3>
<p></p>
<h3>2. Objectives</h3>
<ul>
  <li><p></p></li>
</ul>
<h3>3. Implementation Plan</h3>
<h4>3.1 Technical Solution</h4>
<p></p>
<h4>3.2 Timeline Schedule</h4>
<table>
  <tr><th>Phase</th><th>Task</th><th>Duration</th><th>Owner</th></tr>
  <tr><td></td><td></td><td></td><td></td></tr>
  <tr><td></td><td></td><td></td><td></td></tr>
</table>
<h3>4. Resource Requirements</h3>
<p></p>
<h3>5. Risk Assessment</h3>
<table>
  <tr><th>Risk</th><th>Impact</th><th>Mitigation</th></tr>
  <tr><td></td><td></td><td></td></tr>
</table>
`.trim(),
}

/**
 * Daily Report template
 */
const dailyReport: TemplateItem = {
  key: 'daily-report',
  nameKey: 'editor.templateDailyReport',
  descKey: 'editor.templateDailyReportDesc',
  content: `
<h2>Daily Report</h2>
<p><strong>Name:</strong></p>
<p><strong>Date:</strong></p>
<h3>Done Today</h3>
<ul>
  <li><p></p></li>
</ul>
<h3>Plan Tomorrow</h3>
<ul>
  <li><p></p></li>
</ul>
<h3>Notes</h3>
<p></p>
`.trim(),
}

/**
 * Product Requirement Document template
 */
const productRequirement: TemplateItem = {
  key: 'product-requirement',
  nameKey: 'editor.templateProductRequirement',
  descKey: 'editor.templateProductRequirementDesc',
  content: `
<h2>Product Requirement Document (PRD)</h2>
<h3>1. Background</h3>
<p></p>
<h3>2. Objectives</h3>
<ul>
  <li><p></p></li>
</ul>
<h3>3. User Stories</h3>
<p>As a <em>[role]</em>, I want <em>[feature]</em> so that <em>[value]</em></p>
<h3>4. Feature Description</h3>
<h4>4.1 Feature List</h4>
<table>
  <tr><th>Feature</th><th>Priority</th><th>Description</th></tr>
  <tr><td></td><td>P0</td><td></td></tr>
  <tr><td></td><td>P1</td><td></td></tr>
</table>
<h4>4.2 Detailed Design</h4>
<p></p>
<h3>5. Non-functional Requirements</h3>
<ul>
  <li><p></p></li>
</ul>
<h3>6. Release Plan</h3>
<p></p>
`.trim(),
}

/**
 * All built-in templates
 */
export const builtinTemplates: TemplateItem[] = [
  meetingMinutes,
  weeklyReport,
  dailyReport,
  projectPlan,
  productRequirement,
]
