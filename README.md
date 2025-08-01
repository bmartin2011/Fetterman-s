# Fetterman's Restaurant

A modern restaurant ordering system with Square payment integration.

## Features

- React 19 + TypeScript + Tailwind CSS
- Square Payment Integration
- Mobile-responsive design
- PWA capabilities
- Security-first architecture

## Deployment

### Frontend (Vercel)
1. Connect repository to Vercel
2. Set environment variables
3. Deploy

### Backend (Railway)
1. Connect repository to Railway
2. Set environment variables
3. Deploy from `/server` directory

## Environment Variables

### Frontend (.env.production)
```
REACT_APP_API_URL=your-backend-url
REACT_APP_SQUARE_APPLICATION_ID=your-square-app-id
REACT_APP_SQUARE_LOCATION_ID=your-location-id
REACT_APP_SQUARE_ENVIRONMENT=production
```

### Backend (.env)
```
REACT_APP_SQUARE_ACCESS_TOKEN=your-access-token
REACT_APP_SQUARE_ENVIRONMENT=production
STORE_ONLINE=true
PORT=3001
```

## Production Checklist

- [ ] Set all environment variables
- [ ] Use production Square credentials
- [ ] Test payment flows
- [ ] Verify HTTPS/SSL configuration
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and alerts

## License

MIT License
