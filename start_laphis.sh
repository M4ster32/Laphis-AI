#!/bin/bash

# Script para iniciar/parar servidores LAPHIS
# Uso: ./start.sh (para iniciar) ou ./stop.sh (para parar)

LAPHIS_DIR="/home/m4ster/Laphis"
BACKEND_LOG="/tmp/laphis_backend.log"
FRONTEND_LOG="/tmp/laphis_frontend.log"

case "${1:-start}" in
  start)
    echo "🚀 Iniciando LAPHIS..."
    
    # Backend
    echo "  [1/2] Iniciando Backend (FastAPI)..."
    cd "$LAPHIS_DIR" && nohup bash -c 'source .venv/bin/activate && cd ai-service && python -m uvicorn src.main:app --reload --port 8000' > "$BACKEND_LOG" 2>&1 &
    BACKEND_PID=$!
    echo "  ✅ Backend iniciado (PID: $BACKEND_PID)"
    
    # Esperar backend ficar ready
    sleep 3
    
    # Frontend
    echo "  [2/2] Iniciando Frontend (Vite)..."
    cd "$LAPHIS_DIR/laphis-frontend" && nohup npm run dev > "$FRONTEND_LOG" 2>&1 &
    FRONTEND_PID=$!
    echo "  ✅ Frontend iniciado (PID: $FRONTEND_PID)"
    
    echo ""
    echo "✨ LAPHIS iniciado com sucesso!"
    echo ""
    echo "URLs:"
    echo "  🔙 Backend:  http://localhost:8000"
    echo "  📱 Frontend: http://localhost:5174"
    echo "  📚 Docs:     http://localhost:8000/docs"
    echo ""
    echo "Logs:"
    echo "  Backend:  tail -f $BACKEND_LOG"
    echo "  Frontend: tail -f $FRONTEND_LOG"
    ;;
    
  stop)
    echo "🛑 Parando LAPHIS..."
    pkill -f "uvicorn src.main:app" 2>/dev/null && echo "  ✅ Backend parado" || echo "  ⚠️  Backend não estava rodando"
    pkill -f "npm run dev" 2>/dev/null && echo "  ✅ Frontend parado" || echo "  ⚠️  Frontend não estava rodando"
    echo "✨ LAPHIS parado"
    ;;
    
  logs-backend)
    echo "📋 Logs do Backend:"
    tail -f "$BACKEND_LOG"
    ;;
    
  logs-frontend)
    echo "📋 Logs do Frontend:"
    tail -f "$FRONTEND_LOG"
    ;;
    
  *)
    echo "Uso: $0 {start|stop|logs-backend|logs-frontend}"
    echo ""
    echo "Exemplos:"
    echo "  $0 start          # Iniciar ambos os servidores"
    echo "  $0 stop           # Parar ambos os servidores"
    echo "  $0 logs-backend   # Ver logs do backend"
    echo "  $0 logs-frontend  # Ver logs do frontend"
    ;;
esac
