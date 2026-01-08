# GDPR Compliance Documentation

## Overview

This document outlines Wellness Hub's GDPR compliance implementation, covering data protection, user rights, and privacy requirements under the General Data Protection Regulation (EU) 2016/679.

---

## 1. Legal Basis for Data Processing

### 1.1 Consent (Article 6(1)(a))
- **Analytics Data:** Users explicitly opt-in to analytics tracking
- **Marketing Communications:** Explicit consent required for promotional emails
- **Implementation:** `/app/api/user/consent/route.ts` - Consent management API

### 1.2 Contract Performance (Article 6(1)(b))
- User account creation and management
- Progress tracking and score calculation
- Recipe and meal plan storage
- Shopping list functionality

### 1.3 Legitimate Interest (Article 6(1)(f))
- Security monitoring and fraud prevention
- Service improvement and bug fixes
- Anonymous usage statistics (after anonymization)

---

## 2. User Rights Implementation

### 2.1 Right to Access (Article 15)
**Status:** ✅ Implemented

**Implementation:**
- Settings page displays all user data
- `/components/settings/PrivacySettings.tsx` - Privacy controls UI

**Access Methods:**
- View all data in account settings
- Request data export (see 2.4)

### 2.2 Right to Rectification (Article 16)
**Status:** ✅ Implemented

**Implementation:**
- Profile settings allow data updates
- `/app/(dashboard)/settings/profile/page.tsx` - Edit personal information

**Rectification Options:**
- Edit profile information
- Update dietary preferences
- Modify notification settings

### 2.3 Right to Erasure (Article 17)
**Status:** ✅ Implemented

**Implementation:**
- `/app/api/user/delete-account/route.ts` - Account deletion API
- 30-day grace period before permanent deletion
- Immediate cancellation option

**Process:**
1. User requests deletion via settings
2. Account marked for deletion (30-day window)
3. User can cancel within grace period
4. Permanent deletion after 30 days
5. Audit log maintained for compliance

### 2.4 Right to Data Portability (Article 20)
**Status:** ✅ Implemented

**Implementation:**
- `/app/api/user/data-export/route.ts` - Data export API
- JSON and CSV format support

**Exported Data:**
- Personal information
- Preferences and settings
- Progress tracking data
- Food consumption logs
- Daily scores
- Recipes (user-created and AI-generated)
- Meal plans and shopping lists
- Pantry items
- Favorites, ratings, comments
- Smart recommendations

**Excluded Data (Security):**
- Password hashes
- Stripe payment IDs
- Internal system identifiers

### 2.5 Right to Restrict Processing (Article 18)
**Status:** ✅ Implemented

**Implementation:**
- Consent toggles for analytics and marketing
- Do Not Disturb mode (when notifications implemented)

**Restriction Options:**
- Disable analytics tracking
- Opt-out of marketing emails
- Pause recommendation system (via settings)

### 2.6 Right to Object (Article 21)
**Status:** ✅ Implemented

**Implementation:**
- Consent management system
- Easy opt-out mechanisms

**Objection Methods:**
- Revoke analytics consent
- Unsubscribe from marketing
- Disable specific features

### 2.7 Right to Object to Automated Decision-Making (Article 22)
**Status:** ✅ Implemented

**Note:** 
- AI recommendations are advisory only
- Users can dismiss or ignore recommendations
- No automated decisions affecting legal/financial status
- Human review available via support

---

## 3. Data Categories and Retention

### 3.1 Personal Data Collected

| Category | Data Points | Legal Basis | Retention |
|----------|-------------|-------------|-----------|
| **Identity** | Name, email, user ID | Contract | Active + 30 days |
| **Account** | Password hash, role, subscription | Contract | Active + 30 days |
| **Preferences** | Dietary restrictions, country, timezone | Contract | Active + 30 days |
| **Usage** | Login dates, feature usage, API calls | Legitimate Interest | 18 months |
| **Progress** | Food logs, scores, defense systems | Contract | Active + 30 days |
| **Content** | Recipes, meal plans, shopping lists | Contract | Active + 30 days |
| **Analytics** | Page views, clicks (if consented) | Consent | 12 months |
| **Payment** | Stripe IDs (not card details) | Contract | Active + 7 years* |

*Payment records retained for tax/legal compliance

### 3.2 Retention Policy (Article 5(1)(e))
**Implementation:** `/scripts/cleanup-inactive-accounts.ts`

**Schedule:**
- **Active accounts:** Data retained indefinitely
- **Inactive 18+ months:** Reminder email sent
- **No response after 30 days:** Account anonymized
- **Deleted accounts:** Permanent deletion within 30 days

**Anonymization Process:**
1. Personal data deleted (name, email, password)
2. Food consumption logs removed
3. User content deleted (recipes, plans)
4. Anonymous statistics retained for research
5. User ID replaced with anonymized identifier

---

## 4. Data Security Measures

### 4.1 Technical Measures

**Encryption:**
- TLS 1.3 for data in transit
- AES-256 encryption at rest (database)
- Bcrypt for password hashing (cost factor: 12)

**Access Controls:**
- Role-based access control (RBAC)
- Session-based authentication
- API rate limiting
- Input validation and sanitization

**Database Security:**
- PostgreSQL with row-level security
- Automated backups (encrypted)
- Separate production/development environments
- Principle of least privilege

### 4.2 Organizational Measures

**Data Protection:**
- Privacy by design principles
- Data minimization
- Regular security audits
- Incident response plan

**Staff Training:**
- GDPR awareness training
- Secure coding practices
- Data handling procedures

### 4.3 Third-Party Processors

**Current Processors:**
1. **Vercel** (Hosting)
   - Data Processing Agreement: ✅
   - Location: USA (Privacy Shield certified)
   
2. **Stripe** (Payments)
   - Data Processing Agreement: ✅
   - PCI DSS Level 1 certified
   - Location: USA (Privacy Shield certified)

3. **Neon/Supabase** (Database)
   - Data Processing Agreement: ✅
   - Location: Configurable (EU available)

**Requirements for New Processors:**
- Must sign Data Processing Agreement
- GDPR compliance verification
- Security assessment
- Data transfer mechanism (if outside EU)

---

## 5. Data Transfers

### 5.1 International Transfers

**EU to USA:**
- Reliance on Standard Contractual Clauses (SCCs)
- Privacy Shield certification (where applicable)
- Regular transfer impact assessments

**Safeguards:**
- Encryption in transit and at rest
- Contractual obligations
- Right to access and correction maintained

### 5.2 Transfer Mechanisms
- EU Standard Contractual Clauses (SCCs)
- Adequacy decisions (where available)
- Explicit consent (for specific transfers)

---

## 6. Consent Management

### 6.1 Consent Categories

**Necessary (Always On):**
- Account functionality
- Security
- Core features
- Legal compliance

**Analytics (Opt-in):**
- Usage statistics
- Feature analytics
- Performance monitoring
- Anonymous aggregated data

**Marketing (Opt-in):**
- Product updates
- Wellness tips
- Feature announcements
- Promotional emails

### 6.2 Consent Tracking
**Implementation:** `UserConsent` database model

**Tracked Information:**
- Consent type (necessary, analytics, marketing)
- Granted/revoked status
- Timestamp of consent
- IP address when consented
- User agent (browser info)
- Last update date

**Withdrawal:**
- Easy opt-out via settings
- One-click unsubscribe in emails
- No penalty for withdrawal
- Immediate effect

---

## 7. Data Breach Procedures

### 7.1 Detection
- Automated monitoring
- Security logs review
- User reports
- Third-party notifications

### 7.2 Response Protocol

**Within 24 hours:**
1. Contain the breach
2. Assess impact and scope
3. Notify internal stakeholders
4. Begin investigation

**Within 72 hours:**
1. Notify supervisory authority (if required)
2. Document breach details
3. Implement remediation
4. Prepare user notifications

**User Notification:**
- Required if high risk to rights/freedoms
- Clear explanation of breach
- Measures taken
- Recommended actions
- Contact information

### 7.3 Breach Register
**Location:** Secure internal system
**Contents:**
- Date and time of breach
- Nature of breach
- Data affected
- Number of users impacted
- Actions taken
- Lessons learned

---

## 8. Privacy by Design

### 8.1 Principles Applied

**Data Minimization:**
- Collect only necessary data
- No excessive personal information
- Optional fields clearly marked

**Purpose Limitation:**
- Data used only for stated purposes
- No secondary processing without consent
- Clear privacy notices

**Storage Limitation:**
- Automatic deletion after retention period
- Inactive account cleanup (18 months)
- Regular data audits

**Accuracy:**
- User can update information
- Validation on input
- Regular data quality checks

**Integrity and Confidentiality:**
- Encryption at rest and in transit
- Access controls
- Audit logging

**Accountability:**
- Privacy impact assessments
- Data protection documentation
- Regular compliance reviews

---

## 9. User Support and Complaints

### 9.1 Privacy Contacts

**Data Protection Contact:**
- Email: privacy@wellness-hub.com
- Response time: 48 hours

**Support Channels:**
- Settings page (built-in support)
- Email support
- FAQ/Help center

### 9.2 Complaint Process

**Internal:**
1. Contact privacy@wellness-hub.com
2. Investigation within 7 days
3. Response with resolution
4. Appeal process if unsatisfied

**External:**
- Right to lodge complaint with supervisory authority
- Contact information provided in privacy policy
- No requirement to exhaust internal remedies first

---

## 10. Compliance Monitoring

### 10.1 Regular Audits

**Monthly:**
- Review deletion logs
- Check consent records
- Monitor data access logs
- Test backup restoration

**Quarterly:**
- Privacy impact assessment updates
- Third-party processor review
- Security vulnerability scan
- Staff training updates

**Annually:**
- Full GDPR compliance audit
- Privacy policy review
- Data mapping update
- Penetration testing

### 10.2 Documentation

**Required Records:**
- Processing activities register
- Data protection impact assessments
- Consent records
- Deletion logs
- Breach register
- Third-party processor agreements
- Training records

**Location:** Secure internal repository
**Retention:** 7 years minimum

---

## 11. Implementation Checklist

### Core Features
- [x] Consent management system
- [x] Data export (JSON/CSV)
- [x] Account deletion (30-day grace)
- [x] Privacy settings UI
- [x] Inactive account cleanup
- [x] Deletion audit logs
- [x] Data retention policies

### Documentation
- [x] Privacy policy
- [x] Data processing agreements
- [x] User rights explanations
- [x] Consent tracking
- [ ] Cookie policy (if cookies used)
- [ ] Terms of service update

### Operational
- [x] Automated cleanup script
- [ ] Cron job setup (monthly)
- [ ] Email templates for notifications
- [ ] Breach response plan
- [ ] Staff training program
- [ ] Regular audit schedule

---

## 12. Future Enhancements

### Planned Features
- [ ] Cookie consent banner (if third-party cookies added)
- [ ] Data portability to other platforms
- [ ] Enhanced anonymization options
- [ ] Privacy dashboard with transparency reports
- [ ] Automatic data quality checks

### Under Consideration
- [ ] Age verification for minors
- [ ] Pseudonymization for research data
- [ ] Blockchain-based consent ledger
- [ ] Privacy-preserving analytics

---

## Appendices

### A. Glossary of Terms
- **Data Subject:** Individual whose personal data is processed
- **Data Controller:** Entity determining purposes/means of processing (Wellness Hub)
- **Data Processor:** Entity processing data on controller's behalf (Vercel, Stripe)
- **Personal Data:** Information relating to identified/identifiable person
- **Anonymization:** Irreversible removal of identifying information

### B. Legal References
- GDPR: Regulation (EU) 2016/679
- ePrivacy Directive: 2002/58/EC
- Data Protection Act 2018 (UK)
- CCPA (California): For US users

### C. Contact Information
- **Data Protection Officer:** privacy@wellness-hub.com
- **User Support:** support@wellness-hub.com
- **Security Issues:** security@wellness-hub.com

---

**Document Version:** 1.0  
**Last Updated:** January 8, 2026  
**Next Review:** April 8, 2026  
**Maintained By:** Development & Legal Teams
