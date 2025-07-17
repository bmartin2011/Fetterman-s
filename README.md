# Fetterman's Restaurant - Production Ready

A modern, responsive restaurant ordering system with Square payment integration, built for production deployment.

## 🚀 Features

- **Modern React Architecture**: Built with React 19, TypeScript, and Tailwind CSS
- **Square Payment Integration**: Secure payment processing with Square API
- **Responsive Design**: Mobile-first approach with excellent accessibility (WCAG compliant)
- **Performance Optimized**: Web Vitals tracking, lazy loading, and optimized builds
- **Security First**: Comprehensive security measures including CSP, input validation, and rate limiting
- **Error Handling**: Robust error boundaries and monitoring
- **PWA Ready**: Progressive Web App capabilities with offline support

## 🛡️ Security Features

- Content Security Policy (CSP) implementation
- Input sanitization and validation
- Rate limiting for API calls
- Secure environment variable handling
- Error boundary protection
- Security event logging
- HTTPS enforcement in production

## 📋 Prerequisites

- Node.js 16+ and npm
- Square Developer Account
- Git

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fettermans
   ```

2. **Install dependencies**
   ```bash
   # Frontend dependencies
   npm install
   
   # Backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Environment Setup**
   
   **Frontend (.env)**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Square credentials:
   ```env
   REACT_APP_SQUARE_APPLICATION_ID=your_square_app_id
   REACT_APP_SQUARE_ACCESS_TOKEN=your_square_access_token
   REACT_APP_SQUARE_ENVIRONMENT=sandbox
   REACT_APP_BACKEND_URL=http://localhost:3001
   ```
   
   **Backend (server/.env)**
   ```bash
   cp server/.env.example server/.env
   ```
   
   Edit `server/.env` with your Square credentials:
   ```env
   SQUARE_ACCESS_TOKEN=your_square_access_token
   SQUARE_ENVIRONMENT=sandbox
   PORT=3001
   ```

## 🚀 Development

1. **Start the backend server**
   ```bash
   cd server
   npm start
   ```

2. **Start the frontend development server**
   ```bash
   npm start
   ```

3. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

## 🏗️ Building for Production

```bash
# Production build (optimized)
npm run build:prod

# Analyze bundle size
npm run build:analyze
```

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

### Quick Deploy Options

**Frontend (Static Hosting)**
- Netlify: Connect GitHub repo, set build command to `npm run build:prod`
- Vercel: Import project, configure environment variables
- AWS S3 + CloudFront: Upload build folder, configure CDN

**Backend (Server Hosting)**
- Heroku: `git push heroku main`
- DigitalOcean App Platform: Connect GitHub repo
- AWS Elastic Beanstalk: Deploy with EB CLI

## 🔒 Security Checklist

### Before Production Deployment

- [ ] Update all environment variables for production
- [ ] Set `REACT_APP_SQUARE_ENVIRONMENT=production`
- [ ] Use production Square credentials
- [ ] Enable HTTPS/SSL
- [ ] Configure proper CORS origins
- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Configure security headers
- [ ] Test payment flows thoroughly
- [ ] Set up monitoring and alerts

### Environment Variables Security

- [ ] Never commit `.env` files to version control
- [ ] Use different credentials for development/production
- [ ] Rotate API keys regularly
- [ ] Use environment-specific configurations
- [ ] Validate all environment variables on startup

## 📊 Performance Monitoring

The application includes built-in performance monitoring:

- **Web Vitals**: Core Web Vitals tracking (LCP, FID, CLS)
- **API Performance**: Request timing and error tracking
- **Memory Usage**: JavaScript heap monitoring
- **Bundle Analysis**: Load time tracking
- **User Interactions**: Click and navigation tracking

## 🎨 Customization

### Styling
- Tailwind CSS configuration: `tailwind.config.js`
- Custom styles: `src/index.css`
- Component-specific styles: Individual component files

### Branding
- Logo: `public/logo192.png`, `public/logo512.png`
- Favicon: `public/favicon.ico`
- App manifest: `public/manifest.json`
- Meta tags: `public/index.html`

### Square Integration
- Payment configuration: `src/components/checkout/`
- Product management: `src/components/products/`
- Order processing: `src/context/CartContext.tsx`

## 🐛 Troubleshooting

### Common Issues

**Square API Errors**
- Verify API credentials are correct
- Check environment (sandbox vs production)
- Ensure proper CORS configuration

**Build Errors**
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check TypeScript errors: `npm run type-check`
- Verify environment variables are set

**Performance Issues**
- Analyze bundle size: `npm run build:analyze`
- Check Web Vitals in browser DevTools
- Monitor network requests in DevTools

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Security Configuration](./src/config/security.ts)
- [Performance Utilities](./src/utils/performance.ts)
- [Square API Documentation](https://developer.squareup.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Maintain accessibility standards
- Follow security guidelines
- Update documentation

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section
- Review the deployment documentation

---

**Built with ❤️ for Fetterman's**
