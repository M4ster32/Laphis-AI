FROM python:3.11-slim

WORKDIR /app

# Instala dependências do sistema
RUN apt-get update && apt-get install -y gcc postgresql-client && rm -rf /var/lib/apt/lists/*

# Copia requirements.txt e instala Python packages
COPY ai-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copia código da aplicação
COPY ai-service ./ai-service

# Expõe a porta
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health').read()"

# Comando para iniciar a aplicação
CMD ["python", "-m", "uvicorn", "ai-service.src.main:app", "--host", "0.0.0.0", "--port", "8000"]

