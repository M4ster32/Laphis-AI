"""
Configuração da Base de Dados SQLite com SQLAlchemy
"""
import os
from pathlib import Path
from sqlalchemy import create_engine, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Caminho da base de dados - ABSOLUTO para evitar problemas com working directory
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "laphis.db"

# URL da base de dados (SQLite) - com caminho absoluto
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

# Engine SQLAlchemy
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False  # Muda para True se quiseres ver as queries SQL
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para os modelos
Base = declarative_base()


def get_db() -> Session:
    """
    Dependency para injetar a sessão da BD nos endpoints
    
    Uso em endpoints:
    @router.get("/exemplo")
    def exemplo(db: Session = Depends(get_db)):
        # Usar db aqui
        pass
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _run_migrations(engine_ref) -> None:
    """
    Migrar colunas em falta nas tabelas existentes.
    SQLAlchemy create_all() cria tabelas novas mas NÃO altera tabelas existentes.
    Esta função deteta colunas que faltam e adiciona-as.
    """
    from sqlalchemy import text as sa_text
    inspector = inspect(engine_ref)
    is_sqlite = "sqlite" in str(engine_ref.url)

    for table in Base.metadata.sorted_tables:
        table_name = table.name
        if not inspector.has_table(table_name):
            continue

        existing_cols = {c["name"] for c in inspector.get_columns(table_name)}
        for col in table.columns:
            if col.name in existing_cols:
                continue
            # Determinar tipo SQL
            col_type = col.type.compile(engine_ref.dialect)
            nullable = "NULL" if col.nullable else "NOT NULL"
            default = ""
            if col.default is not None:
                default = f" DEFAULT {col.default.arg!r}" if hasattr(col.default, 'arg') else ""
            elif col.nullable:
                default = " DEFAULT NULL"

            stmt = f'ALTER TABLE {table_name} ADD COLUMN {col.name} {col_type} {nullable}{default}'
            try:
                with engine_ref.begin() as conn:
                    conn.execute(sa_text(stmt))
                print(f"  ✅ Migração: {table_name}.{col.name} ({col_type}) adicionada")
            except Exception as e:
                # Coluna pode já existir em certos edge cases
                print(f"  ⚠️  Migração {table_name}.{col.name}: {e}")


def init_db() -> None:
    """
    Inicializar a base de dados (criar tabelas)
    Chamado no startup da aplicação
    """
    # Criar todas as tabelas
    Base.metadata.create_all(bind=engine)

    # Migrar colunas em falta em tabelas existentes
    _run_migrations(engine)
    
    # Log detalhado
    print("\n" + "="*60)
    print("🗄️  BASE DE DADOS INICIALIZADA")
    print("="*60)
    print(f"📂 Caminho da BD: {DB_PATH}")
    print(f"🔗 DATABASE_URL: {DATABASE_URL}")
    
    # Listar tabelas criadas
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    if tables:
        print(f"✅ Tabelas criadas: {len(tables)}")
        for table in sorted(tables):
            print(f"   - {table}")
    else:
        print("⚠️  AVISO: Nenhuma tabela foi criada!")
        print("   Verifique se os modelos foram importados antes de create_all()")
    
    print("="*60 + "\n")
