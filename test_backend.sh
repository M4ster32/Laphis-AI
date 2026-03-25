#!/bin/bash
# Script para testar se o backend consegue iniciar

cd /home/m4ster/Laphis/ai-service
source /home/m4ster/Laphis/.venv/bin/activate

echo "🔍 Testando imports do backend..."
python -c "from src.main import app; print('✅ Imports OK')" || exit 1

echo ""
echo "🚀 Iniciando backend por 10 segundos..."
timeout 10 python -m uvicorn src.main:app --host 127.0.0.1 --port 8003 2>&1 | head -20 &

sleep 3

echo ""
echo "🌐 Testando health endpoint..."
curl http://127.0.0.1:8003/health 2>&1 | head -10

echo ""
echo "✅ Teste concluído"
pkill -f "uvicorn.*8003"
