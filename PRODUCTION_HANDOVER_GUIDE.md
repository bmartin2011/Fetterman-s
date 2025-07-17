# Production Deployment & Client Handover Guide

## 📋 Pre-Deployment Checklist

### Client Information Required
- [ ] Client's business email address (for hosting accounts)
- [ ] Preferred domain name (e.g., fettermans.com)
- [ ] Square account credentials (Application ID, Access Token)
- [ ] Business contact information
- [ ] Payment method for hosting services

### Technical Preparation
- [ ] Production build tested and optimized
- [ ] All environment variables documented
- [ ] SSL certificates ready
- [ ] Database backup procedures established

## 🚀 Step-by-Step Deployment Process

### Phase 1: Domain Registration (Day 1)

**Option A: Client Registers Domain**
1. **Client Action**: Register domain at Namecheap/GoDaddy using their email
2. **Cost**: $10-15/year
3. **Access**: Client owns domain, provides DNS access

**Option B: Developer Registers (Transfer Later)**
1. **Developer Action**: Register domain temporarily
2. **Transfer**: Move ownership to client after setup
3. **Timeline**: 1-2 weeks for transfer completion

### Phase 2: Hosting Account Setup (Day 1-2)

#### Railway Backend Setup
1. **Account Creation**:
   ```
   Email: client@fettermans.com
   Plan: Hobby ($5/month)
   Payment: Client's credit card
   ```

2. **Environment Variables**:
   ```
   NODE_ENV=production
   SQUARE_APPLICATION_ID=client_provided
   SQUARE_ACCESS_TOKEN=client_provided
   SQUARE_ENVIRONMENT=production
   PORT=3001
   ```

3. **Deployment**:
   ```bash
   # Connect GitHub repository
   railway login
   railway link
   railway up
   ```

#### Vercel Frontend Setup
1. **Account Creation**:
   ```
   Email: client@fettermans.com
   Plan: Free (sufficient for traffic)
   GitHub: Connect client's repository
   ```

2. **Domain Configuration**:
   ```
   Primary: fettermans.com
   Redirect: www.fettermans.com → fettermans.com
   ```

3. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://backend.railway.app
   REACT_APP_SQUARE_APPLICATION_ID=client_provided
   REACT_APP_ENVIRONMENT=production
   ```

### Phase 3: DNS Configuration (Day 2-3)

#### Domain Registrar Settings
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

#### Verification
- [ ] Domain resolves to website
- [ ] SSL certificate active
- [ ] www redirect working
- [ ] Backend API accessible

## 👥 Client Account Transfer Process

### Immediate Setup (Recommended)

**Advantages**:
- Client owns everything from day 1
- No transfer complications
- Direct billing to client
- Full control and access

**Process**:
1. **Pre-meeting**: Gather all client information
2. **Setup Session**: Screen share while creating accounts
3. **Access Sharing**: Client provides temporary access for setup
4. **Handover**: Complete documentation and training

### Developer-First Setup (Alternative)

**When to Use**:
- Client unavailable for immediate setup
- Complex configuration required
- Testing period needed

**Transfer Steps**:
1. **Railway Transfer**:
   ```
   Settings → Transfer Project
   Enter: client@fettermans.com
   Client accepts transfer
   ```

2. **Vercel Transfer**:
   ```
   Project Settings → Transfer
   Enter: client@fettermans.com
   Client accepts via email
   ```

3. **Domain Transfer**:
   ```
   Registrar → Transfer Domain
   Authorization code required
   5-7 day transfer period
   ```

## 📧 Client Communication Templates

### Initial Setup Email
```
Subject: Fetterman's Website - Hosting Setup Required

Hi [Client Name],

To deploy your website, I need the following information:

1. Business email for hosting accounts: _______________
2. Preferred domain name: _______________
3. Square Application ID: _______________
4. Square Access Token: _______________

We'll schedule a 30-minute setup session where I'll help you create the hosting accounts.

Estimated monthly costs:
- Domain: $1.25/month ($15/year)
- Backend hosting: $7-8/month
- Frontend hosting: Free

Total: ~$8-9/month

Best regards,
[Your Name]
```

### Post-Deployment Handover Email
```
Subject: Fetterman's Website - Live & Account Details

Hi [Client Name],

Your website is now live at: https://fettermans.com

Account Access:
- Railway (Backend): client@fettermans.com
- Vercel (Frontend): client@fettermans.com  
- Domain Registrar: client@fettermans.com

Important Documents:
- Login credentials (attached)
- Monthly maintenance guide
- Emergency contact procedures

Next Steps:
- Test all website functionality
- Update Square payment settings
- Schedule monthly check-in

Best regards,
[Your Name]
```

## 🔧 Post-Deployment Checklist

### Immediate Testing (Day 3)
- [ ] Website loads correctly
- [ ] All pages functional
- [ ] Square payments working
- [ ] Mobile responsiveness
- [ ] SSL certificate valid
- [ ] Contact forms working

### Client Training (Day 4)
- [ ] Account access walkthrough
- [ ] Basic troubleshooting
- [ ] Monthly cost review
- [ ] Support contact information
- [ ] Backup procedures explained

### Documentation Handover
- [ ] Account credentials (secure)
- [ ] Technical documentation
- [ ] Maintenance schedule
- [ ] Emergency procedures
- [ ] Future development roadmap

## 💰 Cost Breakdown for Client

### One-Time Costs
- Domain registration: $15/year
- SSL certificate: Free (included)
- Setup fee: [Your rate]

### Monthly Recurring
- Railway backend: $7-8/month
- Vercel frontend: $0/month
- Domain renewal: $1.25/month

### Annual Total
- Hosting: $84-96/year
- Domain: $15/year
- **Total: ~$100-110/year**

## 🚨 Emergency Procedures

### Website Down
1. Check Railway backend status
2. Verify Vercel deployment
3. Confirm DNS settings
4. Contact hosting support

### Payment Issues
1. Update payment method in Railway
2. Verify Vercel account status
3. Check domain renewal date

### Support Contacts
- Railway: support@railway.app
- Vercel: support@vercel.com
- Domain Registrar: [Specific support]
- Developer: [Your contact]

## 📅 Maintenance Schedule

### Weekly
- [ ] Monitor website performance
- [ ] Check error logs
- [ ] Verify payment processing

### Monthly
- [ ] Review hosting costs
- [ ] Update dependencies
- [ ] Performance optimization
- [ ] Security updates

### Quarterly
- [ ] Full backup verification
- [ ] Security audit
- [ ] Performance review
- [ ] Feature planning

---

**Note**: This guide ensures smooth client handover while maintaining professional service standards. Always prioritize client ownership and transparency in the deployment process.