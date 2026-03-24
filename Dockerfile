FROM python:3.11-slim

WORKDIR /app

# Instala dependências de sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copia requirements do backend
COPY ai-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo código
COPY ai-service ./ai-service

# Expõe porta
EXPOSE 8000

# Start command
CMD ["python", "-m", "uvicorn", "ai-service.src.main:app", "--host", "0.0.0.0", "--port", "8000"]

