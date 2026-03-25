FROM python:3.11-slim

WORKDIR /app

# Instala dependências mínimas
RUN apt-get update && apt-get install -y gcc postgresql-client && rm -rf /var/lib/apt/lists/*

# Copia requirements
COPY ai-service/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copia código
COPY ai-service ai-service

# Expõe porta
EXPOSE 8000

# Start - Simples e direto
CMD ["python", "-m", "uvicorn", "ai-service.src.main:app", "--host", "0.0.0.0", "--port", "8000"]

