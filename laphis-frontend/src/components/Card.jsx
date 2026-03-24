/**
 * Componente Card Reutilizável
 * Exemplo de componente que pode ser usado em múltiplas páginas
 */

export default function Card({ 
  title, 
  icon, 
  value, 
  subtitle, 
  children,
  className = "" 
}) {
  return (
    <div className={`card ${className}`}>
      {icon && <div className="card-icon">{icon}</div>}
      {title && <h3 className="card-title">{title}</h3>}
      {value && <div className="card-value">{value}</div>}
      {subtitle && <p className="card-subtitle">{subtitle}</p>}
      {children}
    </div>
  );
}
