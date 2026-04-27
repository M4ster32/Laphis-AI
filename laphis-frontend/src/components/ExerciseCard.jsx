import { useState } from "react";
import {
  Play,
  Clock,
  Flame,
  Target,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Dumbbell,
  Info,
  AlertTriangle,
  Lightbulb,
  Youtube
} from "lucide-react";
import ExerciseImage from "./ExerciseImage";

/**
 * ExerciseCard — Card visual para exercício com imagem, vídeo e instruções
 * @param {Object} exercise - Dados do exercício da API
 * @param {boolean} compact - Modo compacto (lista) ou expandido (detalhe)
 * @param {Function} onStart - Callback quando utilizador clica "Iniciar"
 * @param {Function} onClick - Callback quando clica no card
 */
export default function ExerciseCard({ 
  exercise, 
  compact = false, 
  onStart,
  onClick,
  showActions = true 
}) {
  const [expanded, setExpanded] = useState(false);

  if (!exercise) return null;

  const {
    id,
    name,
    name_en,
    category,
    muscle_primary,
    muscle_secondary,
    difficulty,
    equipment,
    image_url,
    video_url,
    instructions,
    tips,
    common_mistakes,
    default_sets,
    default_reps,
    default_rest_sec,
    is_compound,
    calories_per_min
  } = exercise;

  // Cores por categoria
  const categoryColors = {
    peito: { bg: "rgba(239, 68, 68, 0.1)", text: "#ef4444", border: "rgba(239, 68, 68, 0.3)" },
    costas: { bg: "rgba(59, 130, 246, 0.1)", text: "#3b82f6", border: "rgba(59, 130, 246, 0.3)" },
    pernas: { bg: "rgba(34, 197, 94, 0.1)", text: "#22c55e", border: "rgba(34, 197, 94, 0.3)" },
    ombros: { bg: "rgba(168, 85, 247, 0.1)", text: "#a855f7", border: "rgba(168, 85, 247, 0.3)" },
    biceps: { bg: "rgba(249, 115, 22, 0.1)", text: "#f97316", border: "rgba(249, 115, 22, 0.3)" },
    triceps: { bg: "rgba(236, 72, 153, 0.1)", text: "#ec4899", border: "rgba(236, 72, 153, 0.3)" },
    abdomen: { bg: "rgba(234, 179, 8, 0.1)", text: "#eab308", border: "rgba(234, 179, 8, 0.3)" },
    cardio: { bg: "rgba(6, 182, 212, 0.1)", text: "#06b6d4", border: "rgba(6, 182, 212, 0.3)" },
    full_body: { bg: "rgba(99, 102, 241, 0.1)", text: "#6366f1", border: "rgba(99, 102, 241, 0.3)" },
  };

  const colors = categoryColors[category] || categoryColors.full_body;

  // Ícones por categoria
  const categoryIcons = {
    peito: "💪",
    costas: "🔙",
    pernas: "🦵",
    ombros: "🏋️",
    biceps: "💪",
    triceps: "💪",
    abdomen: "🔥",
    cardio: "❤️",
    full_body: "⚡"
  };

  const difficultyLabels = {
    iniciante: { label: "Iniciante", color: "#22c55e" },
    intermedio: { label: "Intermédio", color: "#f59e0b" },
    avancado: { label: "Avançado", color: "#ef4444" }
  };

  const diffInfo = difficultyLabels[difficulty] || difficultyLabels.intermedio;

  // Modo compacto (para listas)
  if (compact) {
    return (
      <div 
        onClick={() => onClick?.(exercise)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 12,
          background: "var(--bg-secondary)",
          borderRadius: 12,
          border: "1px solid var(--border)",
          cursor: onClick ? "pointer" : "default",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = colors.border;
          e.currentTarget.style.background = colors.bg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.background = "var(--bg-secondary)";
        }}
      >
        {/* Imagem mini */}
        <div style={{
          width: 60,
          height: 60,
          borderRadius: 8,
          overflow: "hidden",
          flexShrink: 0,
          background: "var(--bg-tertiary)"
        }}>
          <ExerciseImage
            src={image_url}
            alt={name}
            category={category}
            name={name}
            compact={true}
          />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontWeight: 600, 
            color: "var(--text)",
            fontSize: 14,
            marginBottom: 4,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            {name}
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: "var(--text-muted)"
          }}>
            <span style={{ 
              background: colors.bg, 
              color: colors.text,
              padding: "2px 6px",
              borderRadius: 4,
              fontWeight: 500
            }}>
              {categoryIcons[category]} {category}
            </span>
            <span>{muscle_primary}</span>
          </div>
        </div>

        {/* Sets x Reps */}
        <div style={{
          textAlign: "right",
          fontSize: 12,
          color: "var(--text-muted)"
        }}>
          <div style={{ fontWeight: 600, color: "var(--text)" }}>
            {default_sets}x{default_reps}
          </div>
          <div>{default_rest_sec}s rest</div>
        </div>
      </div>
    );
  }

  // Modo expandido (card completo)
  return (
    <div style={{
      background: "var(--bg-secondary)",
      borderRadius: 16,
      border: "1px solid var(--border)",
      overflow: "hidden",
      transition: "all 0.3s ease",
    }}>
      {/* Imagem com overlay */}
      <div style={{
        position: "relative",
        width: "100%",
        height: 200,
        overflow: "hidden",
        background: "var(--bg-tertiary)"
      }}>
        <ExerciseImage
          src={image_url}
          alt={name}
          category={category}
          name={name}
          compact={false}
        />
        
        {/* Badges no topo */}
        <div style={{
          position: "absolute",
          top: 12,
          left: 12,
          right: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start"
        }}>
          {/* Categoria */}
          <span style={{
            background: colors.bg,
            color: colors.text,
            padding: "4px 10px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            backdropFilter: "blur(8px)",
            border: `1px solid ${colors.border}`
          }}>
            {categoryIcons[category]} {category.charAt(0).toUpperCase() + category.slice(1)}
          </span>

          {/* Dificuldade */}
          <span style={{
            background: "rgba(0,0,0,0.6)",
            color: diffInfo.color,
            padding: "4px 10px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            backdropFilter: "blur(8px)"
          }}>
            {diffInfo.label}
          </span>
        </div>

        {/* Play button para vídeo */}
        {video_url && (
          <a
            href={video_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "rgba(255, 0, 0, 0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              textDecoration: "none",
              transition: "transform 0.2s ease",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            onClick={(e) => e.stopPropagation()}
          >
            <Youtube size={20} />
          </a>
        )}
      </div>

      {/* Conteúdo */}
      <div style={{ padding: 16 }}>
        {/* Nome */}
        <h3 style={{
          fontSize: 18,
          fontWeight: 700,
          color: "var(--text)",
          margin: 0,
          marginBottom: 4
        }}>
          {name}
        </h3>
        
        {name_en && (
          <div style={{
            fontSize: 13,
            color: "var(--text-muted)",
            marginBottom: 12
          }}>
            {name_en}
          </div>
        )}

        {/* Músculos */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          flexWrap: "wrap"
        }}>
          <Target size={14} style={{ color: colors.text }} />
          <span style={{ fontSize: 13, color: "var(--text)" }}>
            <strong>{muscle_primary}</strong>
            {muscle_secondary && (
              <span style={{ color: "var(--text-muted)" }}> • {muscle_secondary}</span>
            )}
          </span>
        </div>

        {/* Métricas */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          padding: 12,
          background: "var(--bg-tertiary)",
          borderRadius: 12,
          marginBottom: 12
        }}>
          <div style={{ textAlign: "center" }}>
            <Dumbbell size={16} style={{ color: colors.text, marginBottom: 4 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
              {default_sets}x{default_reps}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Séries x Reps</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Clock size={16} style={{ color: colors.text, marginBottom: 4 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
              {default_rest_sec}s
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Descanso</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Flame size={16} style={{ color: colors.text, marginBottom: 4 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
              ~{calories_per_min || 6}/min
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Calorias</div>
          </div>
        </div>

        {/* Equipamento */}
        {equipment && (
          <div style={{
            fontSize: 13,
            color: "var(--text-muted)",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 6
          }}>
            <span style={{ opacity: 0.7 }}>🏋️</span>
            <span><strong>Equipamento:</strong> {equipment}</span>
          </div>
        )}

        {/* Expand/Collapse Instruções */}
        {(instructions || tips || common_mistakes) && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 12px",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text-muted)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              marginBottom: expanded ? 12 : 0,
              transition: "all 0.2s ease"
            }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {expanded ? "Ocultar Detalhes" : "Ver Instruções & Dicas"}
          </button>
        )}

        {/* Conteúdo expandido */}
        {expanded && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            animation: "fadeIn 0.3s ease"
          }}>
            {/* Instruções */}
            {instructions && (
              <div style={{
                padding: 12,
                background: "var(--bg-tertiary)",
                borderRadius: 10,
                borderLeft: `3px solid ${colors.text}`
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                  color: colors.text,
                  fontWeight: 600,
                  fontSize: 13
                }}>
                  <Info size={14} />
                  Instruções
                </div>
                <div style={{
                  fontSize: 13,
                  color: "var(--text)",
                  lineHeight: 1.6,
                  whiteSpace: "pre-line"
                }}>
                  {instructions}
                </div>
              </div>
            )}

            {/* Dicas */}
            {tips && (
              <div style={{
                padding: 12,
                background: "rgba(34, 197, 94, 0.1)",
                borderRadius: 10,
                borderLeft: "3px solid #22c55e"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                  color: "#22c55e",
                  fontWeight: 600,
                  fontSize: 13
                }}>
                  <Lightbulb size={14} />
                  Dicas
                </div>
                <div style={{
                  fontSize: 13,
                  color: "var(--text)",
                  lineHeight: 1.6
                }}>
                  {tips}
                </div>
              </div>
            )}

            {/* Erros comuns */}
            {common_mistakes && (
              <div style={{
                padding: 12,
                background: "rgba(239, 68, 68, 0.1)",
                borderRadius: 10,
                borderLeft: "3px solid #ef4444"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                  color: "#ef4444",
                  fontWeight: 600,
                  fontSize: 13
                }}>
                  <AlertTriangle size={14} />
                  Erros Comuns a Evitar
                </div>
                <div style={{
                  fontSize: 13,
                  color: "var(--text)",
                  lineHeight: 1.6
                }}>
                  {common_mistakes}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ações */}
        {showActions && (
          <div style={{
            display: "flex",
            gap: 10,
            marginTop: 16
          }}>
            <button
              onClick={() => onStart?.(exercise)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 16px",
                background: colors.text,
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              <Play size={18} />
              Iniciar Treino
            </button>

            {video_url && (
              <a
                href={video_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px 16px",
                  background: "var(--bg-tertiary)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <ExternalLink size={18} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ExerciseGrid — Grid de exercícios compactos
 */
export function ExerciseGrid({ exercises, onExerciseClick, onStartExercise }) {
  if (!exercises?.length) {
    return (
      <div style={{
        padding: 24,
        textAlign: "center",
        color: "var(--text-muted)"
      }}>
        Nenhum exercício encontrado
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: 16
    }}>
      {exercises.map(exercise => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onClick={onExerciseClick}
          onStart={onStartExercise}
        />
      ))}
    </div>
  );
}

/**
 * ExerciseList — Lista vertical compacta
 */
export function ExerciseList({ exercises, onExerciseClick }) {
  if (!exercises?.length) {
    return (
      <div style={{
        padding: 16,
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: 14
      }}>
        Nenhum exercício encontrado
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 8
    }}>
      {exercises.map(exercise => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          compact={true}
          onClick={onExerciseClick}
        />
      ))}
    </div>
  );
}
