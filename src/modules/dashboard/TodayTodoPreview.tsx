import { useNavigate } from 'react-router-dom'
import Panel from '../../ui/Panel'
import Button from '../../ui/Button'
import EmptyState from '../../ui/EmptyState'
import TaskRow from '../todo/TaskRow'
import type { TodoTaskInstance } from '../todo/queries'

interface TodayTodoPreviewProps {
  tasks: TodoTaskInstance[]
}

// No-op handlers — TaskRow is read-only in this context
const noop = () => {}

export default function TodayTodoPreview({ tasks }: TodayTodoPreviewProps) {
  const navigate = useNavigate()
  const preview = tasks.slice(0, 5)

  return (
    <Panel
      eyebrow="TODAY"
      right={
        <Button variant="secondary" size="sm" onClick={() => navigate('/todo')}>
          View all
        </Button>
      }
    >
      {preview.length === 0 ? (
        <EmptyState
          message="No tasks due today"
          ctaLabel="Go to To-do"
          onCta={() => navigate('/todo')}
        />
      ) : (
        <div className="divide-y divide-border-subtle -mx-panel-sm lg:-mx-panel">
          {preview.map((instance) => (
            <TaskRow
              key={`${instance.task.id}-${instance.date}`}
              instance={instance}
              onToggle={noop}
              onClick={noop}
              readOnly
              showGrip={false}
            />
          ))}
        </div>
      )}
    </Panel>
  )
}
