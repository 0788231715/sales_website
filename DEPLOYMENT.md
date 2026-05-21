# Deployment Instructions for HOMEVISTA

## Backend (Django)
1. **Database:** Set up a PostgreSQL database.
2. **Environment Variables:** Update `.env` with production values:
   - `DEBUG=False`
   - `SECRET_KEY=<your-secret-key>`
   - `DATABASE_URL=postgres://user:password@host:port/dbname`
   - `CLOUDINARY_*` credentials.
   - `REDIS_URL` for WebSockets.
3. **Migration:** Run `python manage.py migrate`.
4. **Collect Static:** Run `python manage.py collectstatic`.
5. **Server:** Use `gunicorn core.wsgi:application` for HTTP and `daphne -b 0.0.0.0 -p 8001 core.asgi:application` for WebSockets.

## Frontend (Next.js)
1. **Environment Variables:** Set `NEXT_PUBLIC_API_URL` to your backend URL.
2. **Build:** Run `npm run build`.
3. **Start:** Run `npm run start`.
4. **Vercel/Netlify:** Preferred for Next.js deployment.

## Real-time Chat (WebSockets)
- Ensure a Redis server is running and accessible by Django Channels.
- Update `CHANNEL_LAYERS` in `settings.py`.

## Cloudinary
- Create a Cloudinary account and get the credentials for image/video storage.
