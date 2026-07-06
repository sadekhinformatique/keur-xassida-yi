FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    libpq-dev gcc --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

RUN mkdir -p logs media staticfiles

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate && python manage.py shell -c \"from django.contrib.auth import get_user_model; from django.db import transaction; User=get_user_model(); u, _ = User.objects.get_or_create(username='admin', defaults={'email':'admin@rh.com','is_staff':True,'is_superuser':True}); u.set_password('admin123'); u.is_active=True; u.save(); print('Admin OK')\" && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 4"]
