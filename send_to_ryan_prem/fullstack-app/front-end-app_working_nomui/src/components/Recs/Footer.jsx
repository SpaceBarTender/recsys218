import React from 'react';

const footerStyles = `
  /* Outer footer styling in dark mode */
  .footer {
    width: 100%;
    background-color: #242424;
    color: rgba(255, 255, 255, 0.87);
  }
  /* Container with responsive padding and centered content */
  .footer-container {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 48px var(--page-padding);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
    text-align: center;
  }
  @media (min-width: 960px) {
    .footer-container {
      align-items: flex-start;
      text-align: left;
    }
  }
  /* Grouping footer links */
  .footer-links-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  @media (min-width: 600px) {
    .footer-links-container {
      flex-direction: row;
      gap: 64px;
    }
  }
  /* Each footer section styling */
  .footer-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  /* Footer heading styling */
  .footer-heading {
    font-size: 0.875rem;
    font-weight: 500;
    margin: 0;
    color: inherit;
  }
  /* Footer link styling: rely on global CSS for link colors */
  .footer-link {
    font-size: 0.875rem;
    text-decoration: none;
  }
  .footer-link:hover {
    text-decoration: underline;
  }
  /* Bottom section styling with a divider */
  .footer-bottom {
    display: flex;
    justify-content: center;
    padding-top: 32px;
    width: 100%;
    border-top: 1px solid #555;
  }
  /* Divider styling */
  .footer-divider {
    margin: 0;
    border: none;
    border-top: 1px solid #555;
    width: 100%;
  }
`;

export default function Footer() {
  return (
    <React.Fragment>
      <hr className="footer-divider" />
      <style>{footerStyles}</style>
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-links-container">
            <div className="footer-section">
              <p className="footer-heading">News Sources</p>
              <a href="#" className="footer-link">Source 1</a>
              <a href="#" className="footer-link">Source 2</a>
              <a href="#" className="footer-link">Source 3</a>
              <a href="#" className="footer-link">Source 4</a>
            </div>
            <div className="footer-section">
              <p className="footer-heading">J65 Product</p>
              <a href="#" className="footer-link">About us</a>
              <a href="#" className="footer-link">Product Documentation</a>
              <a href="#" className="footer-link">FAQs</a>
            </div>
          </div>
          <div className="footer-bottom">
            {/* Additional bottom content if needed */}
          </div>
        </div>
      </footer>
    </React.Fragment>
  );
}
