import { useState } from 'react'
import type { ProjectEntry } from '../../store/cutStore'

interface Props {
  projects: ProjectEntry[]
  onSave: (name: string) => string
  onOpen: (id: string) => void
  onDelete: (id: string) => void
}

export function ProjectsPanel({ projects, onSave, onOpen, onDelete }: Props) {
  const [name, setName] = useState('')
  const [saved, setSaved] = useState('')

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const fallback = `Proyecto ${projects.length + 1}`
    const projectName = name.trim() || fallback
    onSave(projectName)
    setSaved(projectName)
    setName('')
  }

  return (
    <div className="projects-panel">
      <form className="form" onSubmit={handleSave}>
        <div className="form-row">
          <label>Nombre del proyecto</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={`Ej: Cocina ${new Date().getFullYear()}`}
          />
        </div>
        <button type="submit">Guardar proyecto actual</button>
        <p className="form-hint">
          Guarda una copia de los tableros, piezas y ajustes actuales. El proyecto activo se sigue guardando solo.
        </p>
        {saved && <p className="form-ok">«{saved}» guardado.</p>}
      </form>

      <h4 className="form-section">Proyectos guardados</h4>
      {projects.length === 0 ? (
        <p className="empty-hint">Todavía no hay proyectos guardados.</p>
      ) : (
        <ul className="project-list">
          {projects.map(project => {
            const pieces = project.pieces.reduce((sum, piece) => sum + piece.quantity, 0)
            return (
              <li key={project.id} className="project-item">
                <div className="project-item__info">
                  <strong>{project.name}</strong>
                  <span>
                    {project.boards.length} tablero{project.boards.length === 1 ? '' : 's'} ·{' '}
                    {pieces} pieza{pieces === 1 ? '' : 's'} ·{' '}
                    {new Date(project.savedAt).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="project-item__actions">
                  <button type="button" className="btn-mini" onClick={() => onOpen(project.id)}>
                    Abrir
                  </button>
                  <button
                    type="button"
                    className="btn-mini btn-mini--danger"
                    onClick={() => onDelete(project.id)}
                    title="Eliminar proyecto guardado"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
